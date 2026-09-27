export interface VCardData {
  fn: string;
  n?: string;
  org?: string;
  title?: string;
  tel?: string;
  whatsapp?: string;
  email?: string;
  url?: string;
  adr?: string;
  photoUrl?: string;
}

export function generateVCard(data: VCardData): string {
  const parts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${data.fn}`,
  ];
  
  // N formatting: Family;Given;Middle;Prefix;Suffix
  if (data.n) {
    parts.push(`N;CHARSET=UTF-8:${data.n}`);
  } else {
    // Basic fallback: just use FN as Given
    parts.push(`N;CHARSET=UTF-8:;${data.fn};;;`);
  }

  if (data.org) parts.push(`ORG;CHARSET=UTF-8:${data.org}`);
  if (data.title) parts.push(`TITLE;CHARSET=UTF-8:${data.title}`);
  
  if (data.tel) parts.push(`TEL;TYPE=WORK,VOICE:${data.tel}`);
  if (data.whatsapp) parts.push(`TEL;TYPE=CELL,VOICE:${data.whatsapp}`);
  if (data.email) parts.push(`EMAIL;TYPE=WORK,INTERNET:${data.email}`);
  if (data.url) parts.push(`URL:${data.url}`);
  if (data.adr) {
    // Replace newlines with commas for vCard ADR format
    const formattedAdr = data.adr.replace(/\n/g, ', ');
    parts.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${formattedAdr};;;;`);
  }
  if (data.photoUrl) {
    parts.push(`PHOTO;VALUE=URI:${data.photoUrl}`);
  }
  
  parts.push('END:VCARD');
  
  return parts.join('\n');
}

export async function saveContact(data: VCardData, filename: string) {
  const vcard = generateVCard(data);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const file = new File([blob], `${filename}.vcf`, { type: 'text/vcard' });

  // Try Web Share API first if supported
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Save Contact',
      });
      return;
    } catch (err) {
      // User might have cancelled, or it failed. Fall back to download.
      console.log("Share failed or cancelled:", err);
    }
  }

  // Fallback to download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
