import React, { useState } from 'react';
import { SYSTEM_INSTRUCTION_SPEC } from '../utils/cipher';
import { Copy, Check, FileText } from 'lucide-react';

interface SpecPanelProps {
  currentCustomOutput: string;
}

export const SpecPanel: React.FC<SpecPanelProps> = ({ currentCustomOutput }) => {
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [copiedBundle, setCopiedBundle] = useState(false);

  const combinedPayload = `${SYSTEM_INSTRUCTION_SPEC}\n\n=== ЗАПРОС НА КАСТОМНОЙ РАСКЛАДКЕ ===\n${
    currentCustomOutput || 'h(j)o9e3y6l+ a$q1a$ t5y6s%q1'
  }`;

  const handleCopy = async (text: string, type: 'spec' | 'bundle') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (type === 'spec') {
      setCopiedSpec(true);
      setTimeout(() => setCopiedSpec(false), 1800);
    } else {
      setCopiedBundle(true);
      setTimeout(() => setCopiedBundle(false), 1800);
    }
  };

  return (
    <section
      id="system-prompt"
      aria-labelledby="system-prompt-heading"
      className="bg-[#111827] border border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2
            id="system-prompt-heading"
            className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Системная инструкция и экспорт для нейросети
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Готовый блок системной инструкции с таблицей подстановки и вашим текущим закодированным сообщением.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleCopy(SYSTEM_INSTRUCTION_SPEC, 'spec')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0b0f17] border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {copiedSpec ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Инструкция скопирована</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Копировать только таблицу</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleCopy(combinedPayload, 'bundle')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {copiedBundle ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Промпт + текст скопированы</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Копировать инструкцию + ваш текст</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Таблица и правила (из файла спецификации)</span>
            <span className="font-mono tabular-nums">code_artifact_403aff5e.txt</span>
          </div>
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {SYSTEM_INSTRUCTION_SPEC}
          </pre>
        </div>

        <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium text-slate-300">Предпросмотр полного промпта с вашим запросом</span>
              <span className="font-mono tabular-nums">{combinedPayload.length} симв.</span>
            </div>
            <pre className="text-xs font-mono text-blue-300/90 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
              {`=== ЗАПРОС НА КАСТОМНОЙ РАСКЛАДКЕ ===\n${
                currentCustomOutput || 'h(j)o9e3y6l+ a$q1a$ t5y6s%q1'
              }`}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Готово к отправке в чат или промпт</span>
            <span className="font-mono text-slate-300">РУС ↔ КАСТОМ (33 пары)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
