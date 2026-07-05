import React, { Fragment, ElementType } from 'react';

import { twMerge } from 'tailwind-merge';

export interface StyledTextData {
  text?: string;
  fontSize?: string;
  textAlign?: string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

interface StyledTextProps {
  data?: StyledTextData | string; // Support string for backward compatibility or unmigrated fields
  className?: string;
  defaultTag?: ElementType;
}

export function StyledText({ data, className = '', defaultTag: Tag = 'div' }: StyledTextProps) {
  if (!data) return null;

  // If data is just a string, render it simply (fallback)
  if (typeof data === 'string') {
    return <Tag className={className}>{renderFormattedText(data)}</Tag>;
  }

  const { text, fontSize, textAlign, marginTop, marginBottom, marginLeft, marginRight } = data;

  if (!text) return null;

  // Use transform for visual shifting so it doesn't constrained by flexbox/layout
  const x = (marginLeft || 0) - (marginRight || 0);
  const y = (marginTop || 0) - (marginBottom || 0);

  const style: React.CSSProperties = (x !== 0 || y !== 0) ? {
    '--shift-x': `${x}px`,
    '--shift-y': `${y}px`,
  } as React.CSSProperties : {};

  // twMerge ensures that fontSize from Sanity overrides the default sizes in className
  const combinedClasses = twMerge(
    className,
    textAlign,
    fontSize,
    (x !== 0 || y !== 0) ? 'styled-text-shift' : ''
  );

  return (
    <Tag className={combinedClasses} style={style}>
      {renderFormattedText(text)}
    </Tag>
  );
}

// Helper to render bold/italic text surrounded by asterisks
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line.split(/\*(.*?)\*/).map((part, j) => 
        j % 2 === 1 ? <span key={j} className="font-normal">{part}</span> : part
      )}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}
