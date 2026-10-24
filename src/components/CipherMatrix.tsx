import React, { useState, useMemo } from 'react';
import { CIPHER_TABLE, CipherEntry } from '../utils/cipher';
import { Search, Keyboard } from 'lucide-react';

interface CipherMatrixProps {
  onInsertEntry: (entry: CipherEntry) => void;
  highlightedCode?: string | null;
}

const ROW_LABELS: Record<CipherEntry['rowGroup'], string> = {
  row1: 'Верхний ряд (А–Й · q1–p0)',
  row2: 'Средний ряд (К–Т · a$–l+)',
  row3: 'Нижний ряд (У–Я · z=–;6)',
};

export const CipherMatrix: React.FC<CipherMatrixProps> = ({
  onInsertEntry,
  highlightedCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRowFilter, setActiveRowFilter] = useState<'all' | CipherEntry['rowGroup']>('all');

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CIPHER_TABLE.filter((entry) => {
      if (activeRowFilter !== 'all' && entry.rowGroup !== activeRowFilter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.ruLower.includes(q) ||
        entry.ruUpper.toLowerCase().includes(q) ||
        entry.code.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeRowFilter]);

  return (
    <section
      id="cipher-table"
      aria-labelledby="cipher-table-heading"
      className="bg-[#111827] border border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2
            id="cipher-table-heading"
            className="text-lg font-semibold text-slate-100 tracking-tight"
          >
            Интерактивная таблица раскладки (33 символа)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Нажмите на любую клавишу в таблице, чтобы вставить символ в активное поле ввода.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented row filter */}
          <div
            role="group"
            aria-label="Фильтр по рядам раскладки"
            className="flex items-center gap-1 p-1 bg-[#0b0f17] border border-slate-800 rounded-lg"
          >
            <button
              type="button"
              onClick={() => setActiveRowFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeRowFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все 33
            </button>
            <button
              type="button"
              onClick={() => setActiveRowFilter('row1')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeRowFilter === 'row1'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              А–Й (q1–p0)
            </button>
            <button
              type="button"
              onClick={() => setActiveRowFilter('row2')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeRowFilter === 'row2'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              К–Т (a$–l+)
            </button>
            <button
              type="button"
              onClick={() => setActiveRowFilter('row3')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeRowFilter === 'row3'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              У–Я (z=–;6)
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти букву или код (напр. h( или п)..."
              aria-label="Поиск по таблице символов"
              className="pl-9 pr-3 py-1.5 text-xs bg-[#0b0f17] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-400">
            По запросу «{searchQuery}» совпадений в таблице не найдено.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveRowFilter('all');
            }}
            className="mt-3 px-4 py-2 text-xs font-medium text-blue-400 hover:text-blue-300 border border-slate-800 rounded-lg whitespace-nowrap shrink-0"
          >
            Сбросить фильтр
          </button>
        </div>
      ) : activeRowFilter === 'all' && !searchQuery.trim() ? (
        <div className="mt-5 space-y-5">
          {(['row1', 'row2', 'row3'] as const).map((rowKey) => {
            const rowItems = CIPHER_TABLE.filter((e) => e.rowGroup === rowKey);
            return (
              <div key={rowKey}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                  <span className="font-medium text-slate-300">{ROW_LABELS[rowKey]}</span>
                  <span className="font-mono tabular-nums">{rowItems.length} клавиш</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-11 gap-2">
                  {rowItems.map((entry) => {
                    const isHighlighted = highlightedCode === entry.code;
                    return (
                      <button
                        key={entry.code}
                        type="button"
                        onClick={() => onInsertEntry(entry)}
                        aria-label={`Вставить букву ${entry.ruUpper} (${entry.code})`}
                        className={`group flex flex-col items-center justify-between p-2.5 rounded-lg border transition-colors text-left ${
                          isHighlighted
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-[#0b0f17] border-slate-800/90 hover:border-blue-500/60 hover:bg-slate-900'
                        }`}
                      >
                        <div className="w-full flex items-baseline justify-between">
                          <span className="text-base font-bold text-slate-100 group-hover:text-white">
                            {entry.ruUpper}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {String(entry.position).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="w-full mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300">
                            {entry.code}
                          </span>
                          <Keyboard className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 md:grid-cols-11 gap-2">
          {filteredEntries.map((entry) => {
            const isHighlighted = highlightedCode === entry.code;
            return (
              <button
                key={entry.code}
                type="button"
                onClick={() => onInsertEntry(entry)}
                aria-label={`Вставить букву ${entry.ruUpper} (${entry.code})`}
                className={`group flex flex-col items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  isHighlighted
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-[#0b0f17] border-slate-800 hover:border-blue-500/60 hover:bg-slate-900'
                }`}
              >
                <div className="w-full flex items-baseline justify-between">
                  <span className="text-base font-bold text-slate-100">
                    {entry.ruUpper}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {String(entry.position).padStart(2, '0')}
                  </span>
                </div>
                <div className="w-full mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-blue-400">
                    {entry.code}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Separator & Latin Rule Reference Footer inside Table Section */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-300 font-medium">Правила разделения:</span>
          <span>Пробел = обычный пробел или символ «_»</span>
          <span aria-hidden="true">·</span>
          <span>Латиница и команды = в квадратных скобках: [mcp], [plugins], [rules]</span>
        </div>
        <div className="font-mono text-slate-400 tabular-nums shrink-0">
          Показано: {filteredEntries.length} из 33
        </div>
      </div>
    </section>
  );
};
