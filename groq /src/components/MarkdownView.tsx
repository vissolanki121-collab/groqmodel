import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
  onCitationClick?: (index: number) => void;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, onCitationClick }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split into code blocks and normal text blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose-groq text-sm leading-relaxed text-gray-200 break-words space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          let language = 'text';
          let code = '';

          if (firstLineEnd !== -1) {
            language = part.slice(3, firstLineEnd).trim() || 'code';
            code = part.slice(firstLineEnd + 1, -3);
          } else {
            code = part.slice(3, -3);
          }

          return (
            <div key={index} className="relative my-3 rounded-lg overflow-hidden border border-gray-800 bg-[#0d0f17]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#141724] border-b border-gray-800/80 text-xs font-mono text-gray-400">
                <span className="uppercase tracking-wider text-[11px] font-semibold text-gray-300">{language}</span>
                <button
                  onClick={() => copyCode(code, index)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-emerald-300/90 overflow-x-auto selection:bg-orange-500/20">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render prose lines
        return (
          <div key={index} className="space-y-2">
            {part.split('\n\n').map((paragraph, pIdx) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              // Check for Headings
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-base font-semibold text-white mt-3 mb-1">
                    {renderInlineFormatted(trimmed.slice(4), onCitationClick)}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-lg font-bold text-white mt-4 mb-2">
                    {renderInlineFormatted(trimmed.slice(3), onCitationClick)}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={pIdx} className="text-xl font-bold text-white mt-4 mb-2">
                    {renderInlineFormatted(trimmed.slice(2), onCitationClick)}
                  </h1>
                );
              }

              // Check for bullet lists
              const lines = paragraph.split('\n');
              const isList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || /^\d+\.\s/.test(l.trim()));
              
              if (isList) {
                return (
                  <ul key={pIdx} className="space-y-1.5 pl-2 my-2">
                    {lines.map((l, lIdx) => {
                      const cleanLine = l.replace(/^[-*]\s+|\d+\.\s+/, '');
                      return (
                        <li key={lIdx} className="flex items-start gap-2">
                          <span className="text-orange-400 mt-1 select-none">•</span>
                          <span className="flex-1">{renderInlineFormatted(cleanLine, onCitationClick)}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="text-gray-300 leading-relaxed">
                  {renderInlineFormatted(paragraph, onCitationClick)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Helper for inline bold, code, and citations like [1]
function renderInlineFormatted(text: string, onCitationClick?: (index: number) => void): React.ReactNode {
  // Regex to split bold **...**, inline code `...`, and citations [1], [2], etc.
  const regex = /(\*\*.*?\*\*|`.*?`|\[\d+\])/g;
  const segments = text.split(regex);

  return segments.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[#181b28] border border-gray-800 text-orange-300 font-mono text-[12px]">
          {seg.slice(1, -1)}
        </code>
      );
    }
    if (/^\[\d+\]$/.test(seg)) {
      const citationNumber = parseInt(seg.slice(1, -1), 10);
      return (
        <button
          key={i}
          type="button"
          onClick={() => onCitationClick && onCitationClick(citationNumber)}
          className="inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/40 hover:text-white transition-colors align-super cursor-pointer"
          title={`View Source [${citationNumber}]`}
        >
          {citationNumber}
        </button>
      );
    }
    return seg;
  });
}
