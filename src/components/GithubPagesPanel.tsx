import React, { useState, useMemo, useEffect } from 'react';
import {
  formatGithubPagesUrl,
  buildGitDeployCommands,
  generateStandaloneGithubPagesHtml,
  GITHUB_ACTIONS_WORKFLOW_YAML,
  GITHUB_PERMISSIONS_GUIDE,
} from '../utils/githubPagesBuilder';
import {
  Download,
  Copy,
  Check,
  Globe,
  Terminal,
  FileCode,
  ShieldCheck,
  Rocket,
  RefreshCw,
} from 'lucide-react';

interface GithubStatusResponse {
  configured: boolean;
  login: string | null;
  scopes: string[];
  message: string;
}

interface DeployResult {
  ok: boolean;
  owner?: string;
  repoName?: string;
  pagesUrl?: string;
  repoUrl?: string;
  error?: string;
}

export const GithubPagesPanel: React.FC = () => {
  const [username, setUsername] = useState('bebebe-operator');
  const [repoName, setRepoName] = useState('bebebe-operator.github.io');
  const [activeTab, setActiveTab] = useState<'permissions-auto' | 'single-file' | 'git-actions'>('permissions-auto');

  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  const [ghStatus, setGhStatus] = useState<GithubStatusResponse | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  const fetchGithubStatus = async () => {
    setCheckingStatus(true);
    try {
      const resp = await fetch('/api/github/status');
      if (resp.ok) {
        const data = (await resp.json()) as GithubStatusResponse;
        setGhStatus(data);
        if (data.login) {
          setUsername(data.login);
          setRepoName(`${data.login}.github.io`);
        }
      }
    } catch {
      // ignore network error on initial check
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchGithubStatus();
  }, []);

  const handleAutoDeploy = async () => {
    setDeploying(true);
    setDeployResult(null);
    try {
      const resp = await fetch('/api/github/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName }),
      });
      const data = (await resp.json()) as DeployResult;
      setDeployResult(data);
      if (data.owner) {
        setUsername(data.owner);
      }
    } catch (err) {
      setDeployResult({
        ok: false,
        error: err instanceof Error ? err.message : 'Ошибка запроса к /api/github/deploy',
      });
    } finally {
      setDeploying(false);
    }
  };

  const liveUrl = useMemo(
    () => formatGithubPagesUrl(username, repoName),
    [username, repoName]
  );

  const gitCommands = useMemo(
    () => buildGitDeployCommands(username, repoName),
    [username, repoName]
  );

  const standaloneHtml = useMemo(
    () =>
      generateStandaloneGithubPagesHtml({
        username,
        repoName,
        siteTitle: 'Переводчик Кастомной Раскладки',
      }),
    [username, repoName]
  );

  const handleDownloadStandaloneHtml = () => {
    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (
    text: string,
    which: 'html' | 'git' | 'workflow'
  ) => {
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

    if (which === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 1800);
    } else if (which === 'git') {
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 1800);
    } else {
      setCopiedWorkflow(true);
      setTimeout(() => setCopiedWorkflow(false), 1800);
    }
  };

  return (
    <section
      id="github-pages"
      aria-labelledby="github-pages-heading"
      className="bg-[#111827] border border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2
            id="github-pages-heading"
            className="text-lg font-semibold text-slate-100 tracking-tight flex items-center gap-2"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            Автодеплой полного интерфейса (1:1) на GitHub Pages (github.io)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Права доступа для автоматического создания репозитория и публикации точной копии всего интерфейса на ваш <code className="text-slate-300">github.io</code>.
          </p>
        </div>

        {/* Mode switch */}
        <div
          role="group"
          aria-label="Способ публикации на github.io"
          className="flex items-center gap-1 p-1 bg-[#0b0f17] border border-slate-800 rounded-lg self-start lg:self-auto shrink-0"
        >
          <button
            type="button"
            onClick={() => setActiveTab('permissions-auto')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'permissions-auto'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Права и Автодеплой
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('single-file')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'single-file'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Полный index.html (1:1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('git-actions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'git-actions'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Git + Actions
          </button>
        </div>
      </div>

      {/* Target URL & Repo Config Bar */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0b0f17] border border-slate-800 rounded-lg p-4">
        <div>
          <label
            htmlFor="gh-username"
            className="block text-xs font-medium text-slate-400 mb-1.5"
          >
            Ваш логин GitHub
          </label>
          <input
            id="gh-username"
            type="text"
            value={username}
            onChange={(e) => {
              const nextUser = e.target.value;
              setUsername(nextUser);
              if (repoName.endsWith('.github.io')) {
                setRepoName(`${nextUser.trim() || 'username'}.github.io`);
              }
            }}
            placeholder="username"
            className="w-full px-3 py-2 text-xs font-mono bg-[#111827] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="gh-repo"
            className="block text-xs font-medium text-slate-400 mb-1.5"
          >
            Имя репозитория
          </label>
          <input
            id="gh-repo"
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="username.github.io"
            className="w-full px-3 py-2 text-xs font-mono bg-[#111827] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400">
            Целевой адрес сайта (URL):
          </span>
          <div className="px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <span
              data-testid="gh-pages-target-url"
              className="text-xs font-mono text-blue-400 truncate"
            >
              {liveUrl}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 shrink-0">
              1:1 UI
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'permissions-auto' && (
        <div className="mt-5 space-y-5">
          {/* Permissions table cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {GITHUB_PERMISSIONS_GUIDE.map((guide) => (
              <div
                key={guide.tokenType}
                className="bg-[#0b0f17] border border-slate-800 rounded-lg p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{guide.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {guide.whereToCreate}
                  </p>

                  <div className="mt-4 divide-y divide-slate-800/80 border-t border-slate-800">
                    {guide.scopes.map((sc) => (
                      <div key={sc.name} className="py-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-blue-300">
                            {sc.name}
                          </span>
                          <span className="font-mono text-emerald-400">
                            {sc.access}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {sc.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Server-side Auto-Deploy Action Box */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Rocket className="w-4 h-4 text-blue-400" />
                <span>Автоматическая публикация через переменную GITHUB_TOKEN</span>
              </div>
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                Добавьте ваш токен с указанными выше правами в панель <strong>Secrets</strong> под именем{' '}
                <code className="text-blue-300">GITHUB_TOKEN</code>. Сервер сам создаст репозиторий{' '}
                <code className="text-blue-300">{repoName}</code>, зальёт полный 1:1 интерфейс в{' '}
                <code className="text-blue-300">index.html</code> и включит GitHub Pages.
              </p>
              {ghStatus && (
                <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span
                    className={
                      ghStatus.configured ? 'text-emerald-400' : 'text-amber-400'
                    }
                  >
                    Статус: {ghStatus.message}
                  </span>
                  {ghStatus.scopes.length > 0 && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        Права токена: {ghStatus.scopes.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              )}
              {deployResult && (
                <div
                  className={`mt-2 p-3 rounded-lg border text-xs font-mono ${
                    deployResult.ok
                      ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-700/50 text-rose-300'
                  }`}
                >
                  {deployResult.ok ? (
                    <span>
                      Готово! Репозиторий {deployResult.repoName} создан и опубликован: {deployResult.pagesUrl}
                    </span>
                  ) : (
                    <span>{deployResult.error}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchGithubStatus}
                disabled={checkingStatus}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>Проверить GITHUB_TOKEN</span>
              </button>

              <button
                type="button"
                onClick={handleAutoDeploy}
                disabled={deploying}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>
                  {deploying ? 'Публикация на github.io...' : 'Опубликовать на github.io сейчас'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Скачать полный index.html</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'single-file' && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5 bg-[#0b0f17] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                Полная копия этого интерфейса (1:1) в одном index.html
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                В этот файл вшита <strong>точная 1:1 копия всего текущего интерфейса</strong>: шапка, синхронные поля РУС ↔ КАСТОМ, переключатели пробела/«_» и тегов <code className="text-blue-300">[lat]</code>, посимвольный разбор с подсветкой, 3-рядная матрица всех 33 клавиш с фильтром и поиском, журнал фраз и экспорт системного промпта.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать готовый index.html (1:1)</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(standaloneHtml, 'html')}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {copiedHtml ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>HTML-код скопирован</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Скопировать весь код index.html</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#0b0f17] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium text-slate-300">
                  Код автономного index.html (полный 1:1 интерфейс)
                </span>
                <span className="font-mono tabular-nums">
                  {standaloneHtml.length} байт
                </span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-[#111827] border border-slate-800/90 rounded-lg p-3.5 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {standaloneHtml}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'git-actions' && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  Команды терминала для отправки всего React-проекта
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(gitCommands, 'git')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700 hover:border-slate-500 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedGit ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Копировать команды</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono text-blue-300 bg-[#111827] border border-slate-800 rounded-lg p-3.5 overflow-x-auto leading-relaxed">
                {gitCommands}
              </pre>
            </div>
          </div>

          <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  Файл .github/workflows/deploy.yml (в проекте)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(GITHUB_ACTIONS_WORKFLOW_YAML, 'workflow')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700 hover:border-slate-500 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedWorkflow ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Копировать YAML</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-[#111827] border border-slate-800 rounded-lg p-3.5 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {GITHUB_ACTIONS_WORKFLOW_YAML}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
