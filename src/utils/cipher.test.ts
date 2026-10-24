import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIPHER_TABLE,
  encodeToCustom,
  decodeFromCustom,
  tokenizeText,
  detectInputMode,
} from './cipher';

test('encodes reference example "привет как дела" accurately', () => {
  const encoded = encodeToCustom('привет как дела');
  assert.equal(encoded, 'h(j)o9e3y6l+ a$q1a$ t5y6s%q1');
});

test('decodes reference example "h(j)o9e3y6l+ a$q1a$ t5y6s%q1" accurately', () => {
  const decoded = decodeFromCustom('h(j)o9e3y6l+ a$q1a$ t5y6s%q1');
  assert.equal(decoded, 'привет как дела');
});

test('round-trips all 33 letters of the Russian alphabet', () => {
  const alphabet = CIPHER_TABLE.map((e) => e.ruLower).join('');
  assert.equal(alphabet.length, 33);
  const encoded = encodeToCustom(alphabet);
  const decoded = decodeFromCustom(encoded);
  assert.equal(decoded, alphabet);
});

test('handles k_ (С) vs standalone underscore separator without collision', () => {
  // "сок и суп" -> с=k_, о=g*, к=a$, space=_, и=o9, space=_, с=k_, у=z=, п=h(
  const phrase = 'сок и суп';
  const encoded = encodeToCustom(phrase, { spaceMode: 'underscore' });
  assert.equal(encoded, 'k_g*a$_o9_k_z=h(');
  const decoded = decodeFromCustom(encoded);
  assert.equal(decoded, 'сок и суп');
});

test('handles x[ (Ф), c] (Х), and bracketed Latin words [mcp], [plugins], [rules]', () => {
  const phrase = 'файл и хост в [mcp] и plugins';
  const encoded = encodeToCustom(phrase, { wrapLatin: true });
  assert.equal(encoded, 'x[q1p0s% o9 c]g*k_l+ e3 [mcp] o9 [plugins]');

  const decoded = decodeFromCustom(encoded, { stripLatinBrackets: true });
  assert.equal(decoded, 'файл и хост в mcp и plugins');

  const decodedWithBrackets = decodeFromCustom(encoded, { stripLatinBrackets: false });
  assert.equal(decodedWithBrackets, 'файл и хост в [mcp] и [plugins]');
});

test('detectInputMode distinguishes Russian vs Custom cipher', () => {
  assert.equal(detectInputMode('привет'), 'ru-to-custom');
  assert.equal(detectInputMode('h(j)o9e3y6l+'), 'custom-to-ru');
});

test('tokenizeText produces exact token stream for "привет"', () => {
  const tokens = tokenizeText('привет', 'ru-to-custom');
  assert.equal(tokens.length, 6);
  assert.equal(tokens.map((t) => t.target).join(''), 'h(j)o9e3y6l+');
});

test('GitHub Pages builder formats user/project github.io URLs and embeds all 33 cipher keys in standalone index.html', async () => {
  const {
    formatGithubPagesUrl,
    generateStandaloneGithubPagesHtml,
    GITHUB_PERMISSIONS_GUIDE,
  } = await import('./githubPagesBuilder');
  assert.equal(
    formatGithubPagesUrl('operator', 'operator.github.io'),
    'https://operator.github.io/'
  );
  assert.equal(
    formatGithubPagesUrl('operator', 'custom-translator'),
    'https://operator.github.io/custom-translator/'
  );
  assert.equal(GITHUB_PERMISSIONS_GUIDE.length, 2);

  const html = generateStandaloneGithubPagesHtml({
    username: 'operator',
    repoName: 'operator.github.io',
    siteTitle: 'Тестовый Переводчик',
  });
  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('h(j)o9e3y6l+ a$q1a$ t5y6s%q1'));
  assert.ok(html.includes('"ruUpper":"Я","ruLower":"я","code":";6"'));
  assert.ok(html.includes('id="token-stream-list"'));
  assert.ok(html.includes('id="cipher-table"'));
  assert.ok(html.includes('id="history-section"'));
  assert.ok(html.includes('id="system-prompt"'));
});

