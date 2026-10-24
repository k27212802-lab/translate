import React from 'react';
import { TokenSegment } from '../utils/cipher';

interface TokenStreamInspectorProps {
  segments: TokenSegment[];
  onHoverCode: (code: string | null) => void;
}

export const TokenStreamInspector: React.FC<TokenStreamInspectorProps> = ({
  segments,
  onHoverCode,
}) => {
  const cipherCount = segments.filter((s) => s.type === 'cipher').length;
  const latinCount = segments.filter((s) => s.type === 'latin').length;
  const spaceCount = segments.filter((s) => s.type === 'space').length;

  return (
    <section
      id="token-inspector"
      aria-labelledby="token-inspector-heading"
      className="bg-[#111827] border border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h2
            id="token-inspector-heading"
            className="text-base font-semibold text-slate-100 tracking-tight"
          >
            Посимвольный разбор пар (РУС ↔ КАСТОМ)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Наведите курсор на любую пару, чтобы подсветить соответствующую клавишу в таблице.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
          <span>Букв: {cipherCount}</span>
          <span aria-hidden="true">·</span>
          <span>Пробелов: {spaceCount}</span>
          <span aria-hidden="true">·</span>
          <span>Латиница [..]: {latinCount}</span>
        </div>
      </div>

      {segments.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Введите текст выше, чтобы увидеть посимвольное сопоставление каждой русской буквы и двухсимвольного кода.
        </div>
      ) : (
        <div
          data-testid="token-stream-list"
          className="mt-4 flex flex-wrap items-center gap-1.5 max-h-56 overflow-y-auto pr-1"
        >
          {segments.map((seg) => {
            if (seg.type === 'space') {
              return (
                <div
                  key={seg.id}
                  className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800/70 text-slate-500 font-mono text-xs"
                  title="Разделитель слов (пробел или _)"
                >
                  <span className="text-[11px] text-slate-500">разделитель</span>
                  <span className="text-xs text-slate-300 mt-0.5">
                    {seg.source === '_' || seg.target === '_' ? '_' : 'пробел'}
                  </span>
                </div>
              );
            }

            if (seg.type === 'latin') {
              return (
                <div
                  key={seg.id}
                  className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-amber-950/20 border border-amber-700/40 font-mono text-xs"
                  title="Латинский блок (без шифрования)"
                >
                  <span className="text-amber-300 font-medium">{seg.source}</span>
                  <span className="text-[11px] text-amber-400/80 mt-0.5">{seg.target}</span>
                </div>
              );
            }

            if (seg.type === 'cipher') {
              return (
                <div
                  key={seg.id}
                  onMouseEnter={() => onHoverCode(seg.customCode ?? null)}
                  onMouseLeave={() => onHoverCode(null)}
                  className="flex flex-col items-center justify-center min-w-[44px] px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 hover:border-blue-500 transition-colors cursor-default"
                >
                  <span className="text-xs font-semibold text-slate-200">
                    {seg.ruChar}
                  </span>
                  <span className="text-xs font-mono font-medium text-blue-400 mt-0.5">
                    {seg.customCode}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={seg.id}
                className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800/50 font-mono text-xs text-slate-400"
              >
                <span>{seg.source}</span>
                <span className="text-slate-500 mt-0.5">{seg.target}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
