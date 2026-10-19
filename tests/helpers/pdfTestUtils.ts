import zlib from "zlib";

export interface PDFExtractionResult {
  fullText: string;
  extractedLines: string[];
  hasToUnicodeCMap: boolean;
  fontSubsets: string[];
  hasMojibake: boolean;
}

/**
 * Extracts decoded Unicode text and font metadata from a PDFKit generated buffer.
 * Implements ISO 32000-1 compliant ToUnicode CMap parsing for CIDFontType2 embedded fonts,
 * as well as standard PostScript Type 1 / WinAnsi fallback parsing.
 */
export function extractPDFText(pdfBuffer: Buffer): PDFExtractionResult {
  const pdfString = pdfBuffer.toString("binary");

  // 1. Parse all PDF objects: "<id> 0 obj ... endobj"
  const objMap = new Map<string, { dict: string; stream: string | null }>();
  const objRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
  let match: RegExpExecArray | null;
  while ((match = objRegex.exec(pdfString)) !== null) {
    const objNum = match[1];
    const objBody = match[3];

    const streamMatch = /stream\r?\n([\s\S]*?)\r?\nendstream/.exec(objBody);
    let decompressed: string | null = null;
    if (streamMatch) {
      const raw = Buffer.from(streamMatch[1], "binary");
      try {
        decompressed = zlib.inflateSync(raw).toString("latin1");
      } catch {
        decompressed = raw.toString("latin1");
      }
    }

    const dictPart = streamMatch ? objBody.substring(0, streamMatch.index) : objBody;
    objMap.set(objNum, { dict: dictPart, stream: decompressed });
  }

  // 2. Parse ToUnicode CMap streams into Map<CID, UnicodeChar>
  function parseToUnicode(cmapText: string): Map<number, string> {
    const cmap = new Map<number, string>();

    // Array format: <startCID> <endCID> [ <destHex1> <destHex2> ... ]
    const bfrangeBlockRegex = /beginbfrange([\s\S]*?)endbfrange/g;
    let rangeBlock: RegExpExecArray | null;
    while ((rangeBlock = bfrangeBlockRegex.exec(cmapText)) !== null) {
      let block = rangeBlock[1];

      const bfrangeArr = /<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+\[([\s\S]*?)\]/g;
      let m: RegExpExecArray | null;
      while ((m = bfrangeArr.exec(block)) !== null) {
        const start = parseInt(m[1], 16);
        const hexList = m[3].trim().match(/<([0-9a-fA-F\s]+)>/g) || [];
        hexList.forEach((tag, idx) => {
          const hex = tag.replace(/[<>\s]/g, "");
          const chars: string[] = [];
          for (let i = 0; i < hex.length; i += 4) {
            chars.push(String.fromCharCode(parseInt(hex.substring(i, i + 4), 16)));
          }
          cmap.set(start + idx, chars.join(""));
        });
      }

      // Remove array definitions to prevent sequential regex matching inside [...]
      block = block.replace(/<[0-9a-fA-F]+>\s+<[0-9a-fA-F]+>\s+\[[\s\S]*?\]/g, "");

      // Sequential format: <startCID> <endCID> <destStartHex>
      const bfrangeSeq = /<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g;
      while ((m = bfrangeSeq.exec(block)) !== null) {
        const start = parseInt(m[1], 16);
        const end = parseInt(m[2], 16);
        let dst = parseInt(m[3], 16);
        for (let cid = start; cid <= end; cid++) {
          cmap.set(cid, String.fromCharCode(dst++));
        }
      }
    }

    // Single character format: <srcCID> <destHex>
    const bfcharBlockRegex = /beginbfchar([\s\S]*?)endbfchar/g;
    let charBlock: RegExpExecArray | null;
    while ((charBlock = bfcharBlockRegex.exec(cmapText)) !== null) {
      const block = charBlock[1];
      const bfchar = /<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g;
      let m: RegExpExecArray | null;
      while ((m = bfchar.exec(block)) !== null) {
        const src = parseInt(m[1], 16);
        const hex = m[2];
        const chars: string[] = [];
        for (let i = 0; i < hex.length; i += 4) {
          chars.push(String.fromCharCode(parseInt(hex.substring(i, i + 4), 16)));
        }
        cmap.set(src, chars.join(""));
      }
    }

    return cmap;
  }

  // 3. Associate Font objects with their ToUnicode CMaps and detect font subsets
  const fontObjToCMap = new Map<string, Map<number, string>>();
  const fontSubsets: string[] = [];

  for (const [objNum, { dict }] of objMap.entries()) {
    const fontNameMatch = /\/BaseFont\s*\/([a-zA-Z0-9+_-]+)/.exec(dict);
    if (fontNameMatch) {
      fontSubsets.push(fontNameMatch[1]);
    }

    const toUnicodeMatch = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(dict);
    if (toUnicodeMatch) {
      const cmapObjNum = toUnicodeMatch[1];
      const cmapData = objMap.get(cmapObjNum);
      if (cmapData && cmapData.stream) {
        fontObjToCMap.set(objNum, parseToUnicode(cmapData.stream));
      }
    }
  }

  // 4. Map font aliases (/F1, /F2, etc.) in Resource dictionaries to CMaps
  const fontAliasToCMap = new Map<string, Map<number, string>>();
  for (const [, { dict }] of objMap.entries()) {
    const fontDictMatch = /\/Font\s*<<([\s\S]*?)>>/.exec(dict);
    if (fontDictMatch) {
      const fontEntries = fontDictMatch[1];
      const entryRegex = /\/([a-zA-Z0-9_+-]+)\s+(\d+)\s+0\s+R/g;
      let e: RegExpExecArray | null;
      while ((e = entryRegex.exec(fontEntries)) !== null) {
        const alias = "/" + e[1];
        const targetObj = e[2];
        const cmap = fontObjToCMap.get(targetObj);
        if (cmap) {
          fontAliasToCMap.set(alias, cmap);
        }
      }
    }
  }

  // 5. Decode text from content streams (BT ... ET)
  const extractedLines: string[] = [];
  for (const [, { stream }] of objMap.entries()) {
    if (!stream || !stream.includes("BT")) continue;

    let currentCMap: Map<number, string> | null = null;
    const cmdRegex = /(\/[a-zA-Z0-9_+-]+)\s+[\d.]+\s+Tf|\[([\s\S]*?)\]\s*TJ|(?:\(([\s\S]*?)\)|<([0-9a-fA-F]+)>)\s*Tj/g;
    let cmd: RegExpExecArray | null;
    while ((cmd = cmdRegex.exec(stream)) !== null) {
      if (cmd[1]) {
        currentCMap = fontAliasToCMap.get(cmd[1]) || null;
      } else if (cmd[2] !== undefined) {
        // TJ array
        const inner = cmd[2];
        let text = "";
        const tokRegex = /<([0-9a-fA-F]+)>|\(([\s\S]*?)\)/g;
        let tok: RegExpExecArray | null;
        while ((tok = tokRegex.exec(inner)) !== null) {
          if (tok[1]) {
            const hex = tok[1];
            if (currentCMap) {
              for (let i = 0; i < hex.length; i += 4) {
                const cid = parseInt(hex.substring(i, i + 4), 16);
                text += currentCMap.get(cid) || "";
              }
            } else {
              for (let i = 0; i < hex.length; i += 2) {
                text += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
              }
            }
          } else if (tok[2]) {
            text += tok[2];
          }
        }
        if (text.trim()) {
          extractedLines.push(text.trim());
        }
      } else if (cmd[4]) {
        // <hex> Tj
        const hex = cmd[4];
        let text = "";
        if (currentCMap) {
          for (let i = 0; i < hex.length; i += 4) {
            const cid = parseInt(hex.substring(i, i + 4), 16);
            text += currentCMap.get(cid) || "";
          }
        } else {
          for (let i = 0; i < hex.length; i += 2) {
            text += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
          }
        }
        if (text.trim()) extractedLines.push(text.trim());
      } else if (cmd[3]) {
        // (string) Tj
        if (cmd[3].trim()) extractedLines.push(cmd[3].trim());
      }
    }
  }

  const fullText = extractedLines.join("\n");
  const hasMojibake = /[ŸÝÃ]|\uFFFD/.test(fullText);

  return {
    fullText,
    extractedLines,
    hasToUnicodeCMap: fontAliasToCMap.size > 0,
    fontSubsets,
    hasMojibake,
  };
}
