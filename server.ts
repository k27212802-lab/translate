import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  generateStandaloneGithubPagesHtml,
  formatGithubPagesUrl,
} from './src/utils/githubPagesBuilder';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const githubHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CustomLayoutTranslator-Deployer',
  });

  // Check if GITHUB_TOKEN is configured in environment and inspect scopes
  app.get('/api/github/status', async (_req, res) => {
    const token = process.env.GITHUB_TOKEN?.trim();
    if (!token) {
      res.json({
        configured: false,
        login: null,
        scopes: [],
        message: 'GITHUB_TOKEN не задан в Secrets.',
      });
      return;
    }

    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: githubHeaders(token),
      });
      if (!userResp.ok) {
        res.json({
          configured: false,
          login: null,
          scopes: [],
          message: `Токен отклонен GitHub API (HTTP ${userResp.status}).`,
        });
        return;
      }
      const userData = (await userResp.json()) as { login: string };
      const rawScopes = userResp.headers.get('x-oauth-scopes') || '';
      const scopes = rawScopes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      res.json({
        configured: true,
        login: userData.login,
        scopes,
        message: `Подключен аккаунт @${userData.login}`,
      });
    } catch (err) {
      res.json({
        configured: false,
        login: null,
        scopes: [],
        message: err instanceof Error ? err.message : 'Ошибка соединения с GitHub API',
      });
    }
  });

  // Automatically create repo, commit full 1:1 translator index.html + .nojekyll, and enable GitHub Pages
  app.post('/api/github/deploy', async (req, res) => {
    const token = process.env.GITHUB_TOKEN?.trim();
    if (!token) {
      res.status(400).json({
        ok: false,
        error:
          'Токен GITHUB_TOKEN не найден в переменных окружения. Добавьте GITHUB_TOKEN в панель Secrets с правами public_repo (или Contents + Pages + Administration).',
      });
      return;
    }

    try {
      // 1. Identify authenticated GitHub owner
      const userResp = await fetch('https://api.github.com/user', {
        headers: githubHeaders(token),
      });
      if (!userResp.ok) {
        const errBody = await userResp.text();
        res.status(userResp.status).json({
          ok: false,
          error: `Ошибка авторизации GitHub API (${userResp.status}): ${errBody}`,
        });
        return;
      }
      const userData = (await userResp.json()) as { login: string };
      const owner = userData.login;
      const requestedRepo =
        (req.body?.repoName as string | undefined)?.trim() || `${owner}.github.io`;

      // 2. Check if repository exists; if not, create it
      let defaultBranch = 'main';
      const repoCheck = await fetch(
        `https://api.github.com/repos/${owner}/${requestedRepo}`,
        { headers: githubHeaders(token) }
      );

      if (repoCheck.status === 404) {
        const createResp = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            ...githubHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: requestedRepo,
            description:
              'Двусторонний переводчик кастомной раскладки (РУС ↔ КАСТОМ, 33 символа)',
            homepage: formatGithubPagesUrl(owner, requestedRepo),
            private: false,
            auto_init: true,
          }),
        });

        if (!createResp.ok) {
          const createErr = await createResp.text();
          res.status(createResp.status).json({
            ok: false,
            error: `Не удалось создать репозиторий ${requestedRepo}: ${createErr}`,
          });
          return;
        }
        const createdRepo = (await createResp.json()) as { default_branch?: string };
        defaultBranch = createdRepo.default_branch || 'main';
      } else if (repoCheck.ok) {
        const existingRepo = (await repoCheck.json()) as { default_branch?: string };
        defaultBranch = existingRepo.default_branch || 'main';
      }

      // 3. Helper to create or update a file in the repository
      const upsertRepoFile = async (
        filePath: string,
        contentUtf8: string,
        commitMessage: string
      ) => {
        let existingSha: string | undefined;
        const fileCheck = await fetch(
          `https://api.github.com/repos/${owner}/${requestedRepo}/contents/${filePath}?ref=${defaultBranch}`,
          { headers: githubHeaders(token) }
        );
        if (fileCheck.ok) {
          const fileJson = (await fileCheck.json()) as { sha?: string };
          existingSha = fileJson.sha;
        }

        const putResp = await fetch(
          `https://api.github.com/repos/${owner}/${requestedRepo}/contents/${filePath}`,
          {
            method: 'PUT',
            headers: {
              ...githubHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: commitMessage,
              content: Buffer.from(contentUtf8, 'utf-8').toString('base64'),
              branch: defaultBranch,
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          }
        );

        if (!putResp.ok) {
          const putErr = await putResp.text();
          throw new Error(`Ошибка записи ${filePath} (${putResp.status}): ${putErr}`);
        }
      };

      const fullHtml = generateStandaloneGithubPagesHtml({
        username: owner,
        repoName: requestedRepo,
        siteTitle: 'Переводчик Кастомной Раскладки',
      });

      await upsertRepoFile(
        'index.html',
        fullHtml,
        'Deploy full 1:1 custom layout translator to GitHub Pages'
      );
      await upsertRepoFile('.nojekyll', '', 'Add .nojekyll for GitHub Pages');

      // 4. Enable GitHub Pages on defaultBranch root '/'
      await fetch(`https://api.github.com/repos/${owner}/${requestedRepo}/pages`, {
        method: 'POST',
        headers: {
          ...githubHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: {
            branch: defaultBranch,
            path: '/',
          },
        }),
      });

      const pagesUrl = formatGithubPagesUrl(owner, requestedRepo);
      res.json({
        ok: true,
        owner,
        repoName: requestedRepo,
        pagesUrl,
        repoUrl: `https://github.com/${owner}/${requestedRepo}`,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Неизвестная ошибка при деплое',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
