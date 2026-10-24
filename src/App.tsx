import React, { useState, useMemo } from 'react';
import {
  CipherEntry,
  encodeToCustom,
  decodeFromCustom,
  tokenizeText,
} from './utils/cipher';
import { CipherMatrix } from './components/CipherMatrix';
import { TokenStreamInspector } from './components/TokenStreamInspector';
import { SpecPanel } from './components/SpecPanel';
import { GithubPagesPanel } from './components/GithubPagesPanel';
import {
  ArrowLeftRight,
  Copy,
  Check,
  Trash2,
  BookmarkPlus,
  RotateCcw,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  ruText: string;
  customText: string;
  spaceMode: 'space' | 'underscore';
  timestamp: string;
}

const PRESET_EXAMPLES = [
  {
    label: 'привет',
    ru: 'привет',
  },
  {
    label: 'привет как дела (пример из таблицы)',
    ru: 'привет как дела',
  },
  {
    label: 'команды [mcp] и [plugins]',
    ru: 'проверь папку [mcp] и подключи [plugins]',
  },
  {
    label: 'правила [rules] и сок',
    ru: 'обнови [rules] и сделай тест',
  },
];

const INITIAL_RU = 'привет как дела';

export default function App() {
  const [direction, setDirection] = useState<'ru-to-custom' | 'custom-to-ru'>('ru-to-custom');
  const [spaceMode, setSpaceMode] = useState<'space' | 'underscore'>('space');
  const [wrapLatin, setWrapLatin] = useState<boolean>(true);
  const [stripLatinBrackets, setStripLatinBrackets] = useState<boolean>(true);

  const [ruText, setRuText] = useState<string>(INITIAL_RU);
  const [customText, setCustomText] = useState<string>(() =>
    encodeToCustom(INITIAL_RU, { spaceMode: 'space', wrapLatin: true })
  );

  const [copiedPane, setCopiedPane] = useState<'ru' | 'custom' | 'top' | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'seed-1',
      ruText: 'привет как дела',
      customText: 'h(j)o9e3y6l+ a$q1a$ t5y6s%q1',
      spaceMode: 'space',
      timestamp: 'Эталон из спецификации',
    },
    {
      id: 'seed-2',
      ruText: 'привет',
      customText: 'h(j)o9e3y6l+',
      spaceMode: 'space',
      timestamp: 'Быстрый шаблон',
    },
  ]);

  // Handlers for live bidirectional editing
  const handleRuChange = (nextRu: string) => {
    setRuText(nextRu);
    setDirection('ru-to-custom');
    setCustomText(encodeToCustom(nextRu, { spaceMode, wrapLatin }));
  };

  const handleCustomChange = (nextCustom: string) => {
    setCustomText(nextCustom);
    setDirection('custom-to-ru');
    setRuText(decodeFromCustom(nextCustom, { stripLatinBrackets }));
  };

  const handleSpaceModeChange = (nextMode: 'space' | 'underscore') => {
    setSpaceMode(nextMode);
    setCustomText(encodeToCustom(ruText, { spaceMode: nextMode, wrapLatin }));
  };

  const handleWrapLatinToggle = () => {
    const nextWrap = !wrapLatin;
    setWrapLatin(nextWrap);
    setCustomText(encodeToCustom(ruText, { spaceMode, wrapLatin: nextWrap }));
  };

  const handleStripBracketsToggle = () => {
    const nextStrip = !stripLatinBrackets;
    setStripLatinBrackets(nextStrip);
    if (direction === 'custom-to-ru') {
      setRuText(decodeFromCustom(customText, { stripLatinBrackets: nextStrip }));
    }
  };

  const handleSwapDirection = () => {
    if (direction === 'ru-to-custom') {
      setDirection('custom-to-ru');
      setRuText(decodeFromCustom(customText, { stripLatinBrackets }));
    } else {
      setDirection('ru-to-custom');
      setCustomText(encodeToCustom(ruText, { spaceMode, wrapLatin }));
    }
  };

  const handleApplyPreset = (presetRu: string) => {
    setDirection('ru-to-custom');
    setRuText(presetRu);
    setCustomText(encodeToCustom(presetRu, { spaceMode, wrapLatin }));
  };

  const handleInsertEntry = (entry: CipherEntry) => {
    if (direction === 'ru-to-custom') {
      const nextRu = ruText + entry.ruLower;
      handleRuChange(nextRu);
    } else {
      const nextCustom = customText + entry.code;
      handleCustomChange(nextCustom);
    }
  };

  const handleClear = () => {
    setRuText('');
    setCustomText('');
  };

  const handleSaveToHistory = () => {
    if (!ruText.trim() && !customText.trim()) return;
    const newItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      ruText,
      customText,
      spaceMode,
      timestamp: new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 9)]);
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setRuText(item.ruText);
    setCustomText(item.customText);
    setSpaceMode(item.spaceMode);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const copyText = async (text: string, target: 'ru' | 'custom' | 'top') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedPane(target);
    setTimeout(() => setCopiedPane(null), 1800);
  };

  const tokenSegments = useMemo(
    () =>
      tokenizeText(
        direction === 'ru-to-custom' ? ruText : customText,
        direction,
        { spaceMode, wrapLatin },
        { stripLatinBrackets }
      ),
    [ruText, customText, direction, spaceMode, wrapLatin, stripLatinBrackets]
  );

  const primaryOutput = direction === 'ru-to-custom' ? customText : ruText;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0b0f17]/95 sticky top-0 z-30 backdrop-blur-sm">
        <a
          href="#translator"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          КастомРаскладка
        </a>

        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#translator"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Переводчик
          </a>
          <a
            href="#token-inspector"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Разбор пар
          </a>
          <a
            href="#cipher-table"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Таблица символов
          </a>
          <a
            href="#system-prompt"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Системный промпт
          </a>
          <a
            href="#github-pages"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Сайт github.io
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => copyText(primaryOutput, 'top')}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            {copiedPane === 'top' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Результат скопирован</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Копировать перевод</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container (1440px desktop baseline) */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero & Toolbar Header */}
        <section id="translator" className="space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
                Переводчик кастомной раскладки
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Вводите текст на русском (например, «привет») или код на вашей раскладке («h(j)o9e3y6l+») — оба поля переводят в обе стороны мгновенно.
              </p>
            </div>

            {/* Direction & Formatting Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Direction segmented switch */}
              <div
                role="group"
                aria-label="Режим направления перевода"
                className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setDirection('ru-to-custom')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    direction === 'ru-to-custom'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  РУС → КАСТОМ
                </button>
                <button
                  type="button"
                  onClick={handleSwapDirection}
                  aria-label="Поменять направление перевода"
                  title="Переключить активное направление"
                  className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('custom-to-ru')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    direction === 'custom-to-ru'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  КАСТОМ → РУС
                </button>
              </div>

              {/* Space separator selector */}
              <div
                role="group"
                aria-label="Разделитель слов в кастомной раскладке"
                className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => handleSpaceModeChange('space')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    spaceMode === 'space'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Пробел « »
                </button>
                <button
                  type="button"
                  onClick={() => handleSpaceModeChange('underscore')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    spaceMode === 'underscore'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Символ «_»
                </button>
              </div>

              {/* Latin brackets toggle */}
              <button
                type="button"
                onClick={handleWrapLatinToggle}
                aria-pressed={wrapLatin}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  wrapLatin
                    ? 'bg-[#111827] border-blue-500/60 text-blue-300'
                    : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {wrapLatin ? 'Теги [lat]: Вкл' : 'Теги [lat]: Выкл'}
              </button>

              <button
                type="button"
                onClick={handleStripBracketsToggle}
                aria-pressed={stripLatinBrackets}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  stripLatinBrackets
                    ? 'bg-[#111827] border-slate-700 text-slate-200'
                    : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {stripLatinBrackets ? 'Декод без [..]' : 'Декод с [..]'}
              </button>
            </div>
          </div>

          {/* Preset Phrase Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">Быстрые примеры:</span>
              {PRESET_EXAMPLES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset.ru)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveToHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Сохранить в журнал</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить оба поля</span>
              </button>
            </div>
          </div>

          {/* Dual Synchronized Editor Panes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Pane: Russian Text */}
            <div
              className={`bg-[#111827] border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                direction === 'ru-to-custom'
                  ? 'border-blue-500/70'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <label
                    htmlFor="russian-textarea"
                    className="text-sm font-semibold text-slate-100 flex items-center gap-2"
                  >
                    <span>Русский язык (Исходный текст / Декод)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {ruText.length} симв.
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(ruText, 'ru')}
                      aria-label="Копировать русский текст"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0b0f17] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {copiedPane === 'ru' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Копировать русский</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  id="russian-textarea"
                  value={ruText}
                  onChange={(e) => handleRuChange(e.target.value)}
                  placeholder="Введите текст на русском (например: привет как дела)..."
                  rows={6}
                  className="w-full mt-3 bg-transparent text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Прямой ввод на русском</span>
                <span className="font-mono tabular-nums">
                  Слов: {ruText.trim() ? ruText.trim().split(/\s+/).length : 0}
                </span>
              </div>
            </div>

            {/* Right Pane: Custom Cipher Layout */}
            <div
              className={`bg-[#111827] border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                direction === 'custom-to-ru'
                  ? 'border-blue-500/70'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <label
                    htmlFor="custom-textarea"
                    className="text-sm font-semibold text-blue-300 flex items-center gap-2"
                  >
                    <span>Ваша кастомная раскладка (Шифр подстановки)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {customText.length} симв.
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(customText, 'custom')}
                      aria-label="Копировать кастомную раскладку"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {copiedPane === 'custom' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Копировать раскладку</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  id="custom-textarea"
                  value={customText}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="Введите или вставьте код на кастомной раскладке (напр. h(j)o9e3y6l+ a$q1a$ t5y6s%q1)..."
                  rows={6}
                  className="w-full mt-3 bg-transparent font-mono text-base text-blue-200 placeholder-slate-500 focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Поддержка пробела, «_» и тегов [mcp], [plugins], [rules]</span>
                <span className="font-mono text-blue-400 tabular-nums">
                  2 симв. = 1 буква
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Token Stream Breakdown */}
        <TokenStreamInspector
          segments={tokenSegments}
          onHoverCode={setHighlightedCode}
        />

        {/* Interactive 33-Key Cipher Matrix */}
        <CipherMatrix
          onInsertEntry={handleInsertEntry}
          highlightedCode={highlightedCode}
        />

        {/* Saved Translations History Table */}
        <section
          aria-labelledby="history-heading"
          className="bg-[#111827] border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2
                id="history-heading"
                className="text-base font-semibold text-slate-100 tracking-tight"
              >
                Журнал сохранённых фраз
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Быстрое переключение между часто используемыми фразами и командами на вашей раскладке.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Записей: {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">
                Журнал пуст. Нажмите «Сохранить в журнал», чтобы закрепить текущий перевод.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">Русский текст</th>
                    <th className="py-2.5 px-4 font-medium">Запись на кастомной раскладке</th>
                    <th className="py-2.5 px-4 font-medium">Метка</th>
                    <th className="py-2.5 pl-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3 pr-4 text-slate-200 font-medium">
                        {item.ruText}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-300">
                        {item.customText}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono tabular-nums whitespace-nowrap">
                        {item.timestamp}
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreHistory(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-[#0b0f17] hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                          >
                            <RotateCcw className="w-3 h-3 text-blue-400" />
                            <span>Загрузить</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(item.id)}
                            aria-label={`Удалить запись ${item.ruText}`}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* System Instruction & Prompt Exporter */}
        <SpecPanel currentCustomOutput={customText} />

        {/* GitHub Pages (github.io) Standalone Site Generator & Deploy Hub */}
        <GithubPagesPanel />
      </main>

      <footer className="border-t border-slate-800/80 py-5 px-6 text-xs text-slate-500">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Переводчик кастомной раскладки · 33 символа (А=q1 … Я=;6)</span>
          <span className="font-mono tabular-nums">
            Поддержка разделителей « » / «_» и латиницы [mcp]
          </span>
        </div>
      </footer>
    </div>
  );
}
