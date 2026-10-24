export interface CipherEntry {
  ruUpper: string;
  ruLower: string;
  code: string;
  rowGroup: 'row1' | 'row2' | 'row3';
  position: number;
}

export interface EncodeOptions {
  spaceMode: 'space' | 'underscore';
  wrapLatin: boolean;
}

export interface DecodeOptions {
  stripLatinBrackets: boolean;
  preserveSentenceCase: boolean;
}

export interface TokenSegment {
  id: string;
  type: 'cipher' | 'space' | 'latin' | 'punct';
  source: string;
  target: string;
  ruChar?: string;
  customCode?: string;
}

export const CIPHER_TABLE: CipherEntry[] = [
  { ruUpper: 'А', ruLower: 'а', code: 'q1', rowGroup: 'row1', position: 1 },
  { ruUpper: 'Б', ruLower: 'б', code: 'w2', rowGroup: 'row1', position: 2 },
  { ruUpper: 'В', ruLower: 'в', code: 'e3', rowGroup: 'row1', position: 3 },
  { ruUpper: 'Г', ruLower: 'г', code: 'r4', rowGroup: 'row1', position: 4 },
  { ruUpper: 'Д', ruLower: 'д', code: 't5', rowGroup: 'row1', position: 5 },
  { ruUpper: 'Е', ruLower: 'е', code: 'y6', rowGroup: 'row1', position: 6 },
  { ruUpper: 'Ё', ruLower: 'ё', code: 'y0', rowGroup: 'row1', position: 7 },
  { ruUpper: 'Ж', ruLower: 'ж', code: 'u7', rowGroup: 'row1', position: 8 },
  { ruUpper: 'З', ruLower: 'з', code: 'i8', rowGroup: 'row1', position: 9 },
  { ruUpper: 'И', ruLower: 'и', code: 'o9', rowGroup: 'row1', position: 10 },
  { ruUpper: 'Й', ruLower: 'й', code: 'p0', rowGroup: 'row1', position: 11 },
  { ruUpper: 'К', ruLower: 'к', code: 'a$', rowGroup: 'row2', position: 12 },
  { ruUpper: 'Л', ruLower: 'л', code: 's%', rowGroup: 'row2', position: 13 },
  { ruUpper: 'М', ruLower: 'м', code: 'd^', rowGroup: 'row2', position: 14 },
  { ruUpper: 'Н', ruLower: 'н', code: 'f&', rowGroup: 'row2', position: 15 },
  { ruUpper: 'О', ruLower: 'о', code: 'g*', rowGroup: 'row2', position: 16 },
  { ruUpper: 'П', ruLower: 'п', code: 'h(', rowGroup: 'row2', position: 17 },
  { ruUpper: 'Р', ruLower: 'р', code: 'j)', rowGroup: 'row2', position: 18 },
  { ruUpper: 'С', ruLower: 'с', code: 'k_', rowGroup: 'row2', position: 19 },
  { ruUpper: 'Т', ruLower: 'т', code: 'l+', rowGroup: 'row2', position: 20 },
  { ruUpper: 'У', ruLower: 'у', code: 'z=', rowGroup: 'row3', position: 21 },
  { ruUpper: 'Ф', ruLower: 'ф', code: 'x[', rowGroup: 'row3', position: 22 },
  { ruUpper: 'Х', ruLower: 'х', code: 'c]', rowGroup: 'row3', position: 23 },
  { ruUpper: 'Ц', ruLower: 'ц', code: 'v{', rowGroup: 'row3', position: 24 },
  { ruUpper: 'Ч', ruLower: 'ч', code: 'b}', rowGroup: 'row3', position: 25 },
  { ruUpper: 'Ш', ruLower: 'ш', code: 'n|', rowGroup: 'row3', position: 26 },
  { ruUpper: 'Щ', ruLower: 'щ', code: 'm~', rowGroup: 'row3', position: 27 },
  { ruUpper: 'Ъ', ruLower: 'ъ', code: '<1', rowGroup: 'row3', position: 28 },
  { ruUpper: 'Ы', ruLower: 'ы', code: '>2', rowGroup: 'row3', position: 29 },
  { ruUpper: 'Ь', ruLower: 'ь', code: '?3', rowGroup: 'row3', position: 30 },
  { ruUpper: 'Э', ruLower: 'э', code: '/4', rowGroup: 'row3', position: 31 },
  { ruUpper: 'Ю', ruLower: 'ю', code: ':5', rowGroup: 'row3', position: 32 },
  { ruUpper: 'Я', ruLower: 'я', code: ';6', rowGroup: 'row3', position: 33 },
];

const RU_TO_CODE = new Map<string, string>();
const CODE_TO_RU = new Map<string, string>();

for (const entry of CIPHER_TABLE) {
  RU_TO_CODE.set(entry.ruUpper, entry.code);
  RU_TO_CODE.set(entry.ruLower, entry.code);
  CODE_TO_RU.set(entry.code, entry.ruLower);
  CODE_TO_RU.set(entry.code.toUpperCase(), entry.ruLower);
}

const DEFAULT_ENCODE_OPTIONS: EncodeOptions = {
  spaceMode: 'space',
  wrapLatin: true,
};

const DEFAULT_DECODE_OPTIONS: DecodeOptions = {
  stripLatinBrackets: true,
  preserveSentenceCase: false,
};

function isLatinLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function isLatinWordChar(ch: string): boolean {
  return (
    isLatinLetter(ch) ||
    (ch >= '0' && ch <= '9') ||
    ch === '_' ||
    ch === '-' ||
    ch === '.' ||
    ch === '/'
  );
}

/**
 * Encodes Russian text (with optional Latin tokens) into the custom 2-char layout.
 */
export function encodeToCustom(
  input: string,
  options: Partial<EncodeOptions> = {}
): string {
  const opts: EncodeOptions = { ...DEFAULT_ENCODE_OPTIONS, ...options };
  let result = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // 1. Preserve already bracketed blocks like [mcp], [plugins], [rules]
    if (ch === '[') {
      const closeIdx = input.indexOf(']', i + 1);
      if (closeIdx !== -1) {
        const inner = input.slice(i + 1, closeIdx);
        // Check if inner has no Cyrillic characters
        if (!/[а-яА-ЯёЁ]/.test(inner)) {
          result += input.slice(i, closeIdx + 1);
          i = closeIdx + 1;
          continue;
        }
      }
    }

    // 2. Russian letter lookup
    const code = RU_TO_CODE.get(ch);
    if (code !== undefined) {
      result += code;
      i += 1;
      continue;
    }

    // 3. Space handling
    if (ch === ' ') {
      result += opts.spaceMode === 'underscore' ? '_' : ' ';
      i += 1;
      continue;
    }

    // 4. Contiguous Latin word / path handling
    if (isLatinLetter(ch)) {
      let end = i + 1;
      while (end < input.length && isLatinWordChar(input[end])) {
        end += 1;
      }
      const latinRun = input.slice(i, end);
      result += opts.wrapLatin ? `[${latinRun}]` : latinRun;
      i = end;
      continue;
    }

    // 5. Any other punctuation/digits/newlines remain as-is
    result += ch;
    i += 1;
  }

  return result;
}

/**
 * Decodes custom 2-char layout back to Russian text.
 * Handles:
 * - [latin] blocks (e.g. [mcp], [plugins], [rules])
 * - 2-character cipher pairs (including k_ -> с, x[ -> ф, c] -> х)
 * - _ or space as word separators
 */
export function decodeFromCustom(
  input: string,
  options: Partial<DecodeOptions> = {}
): string {
  const opts: DecodeOptions = { ...DEFAULT_DECODE_OPTIONS, ...options };
  let result = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // 1. Check 2-char cipher token FIRST when ch is not '['
    // Note: 'x[' is Ф, whereas standalone '[' starts a Latin block [mcp]
    if (i + 1 < input.length) {
      const pair = input.slice(i, i + 2);
      const ru = CODE_TO_RU.get(pair) ?? CODE_TO_RU.get(pair.toLowerCase());
      if (ru !== undefined) {
        result += ru;
        i += 2;
        continue;
      }
    }

    // 2. Check bracketed Latin block [mcp], [plugins], [rules]
    if (ch === '[') {
      const closeIdx = input.indexOf(']', i + 1);
      if (closeIdx !== -1) {
        const inner = input.slice(i + 1, closeIdx);
        result += opts.stripLatinBrackets ? inner : `[${inner}]`;
        i = closeIdx + 1;
        continue;
      }
    }

    // 3. Underscore separator -> space (since k_ was already matched in step 1)
    if (ch === '_') {
      result += ' ';
      i += 1;
      continue;
    }

    // 4. Everything else (spaces, punctuation, unbracketed English words)
    result += ch;
    i += 1;
  }

  if (opts.preserveSentenceCase) {
    return applySentenceCase(result);
  }

  return result;
}

function applySentenceCase(text: string): string {
  let capitalizeNext = true;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (capitalizeNext && /[а-яёa-z]/i.test(ch)) {
      out += ch.toUpperCase();
      capitalizeNext = false;
    } else {
      out += ch;
      if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
        capitalizeNext = true;
      }
    }
  }
  return out;
}

/**
 * Tokenizes either Russian input or Custom cipher input into inspectable segments.
 */
export function tokenizeText(
  input: string,
  direction: 'ru-to-custom' | 'custom-to-ru',
  encodeOpts: Partial<EncodeOptions> = {},
  decodeOpts: Partial<DecodeOptions> = {}
): TokenSegment[] {
  const eOpts: EncodeOptions = { ...DEFAULT_ENCODE_OPTIONS, ...encodeOpts };
  const dOpts: DecodeOptions = { ...DEFAULT_DECODE_OPTIONS, ...decodeOpts };
  const segments: TokenSegment[] = [];
  let i = 0;
  let idx = 0;

  if (direction === 'ru-to-custom') {
    while (i < input.length) {
      const ch = input[i];

      if (ch === '[') {
        const closeIdx = input.indexOf(']', i + 1);
        if (closeIdx !== -1 && !/[а-яА-ЯёЁ]/.test(input.slice(i + 1, closeIdx))) {
          const raw = input.slice(i, closeIdx + 1);
          segments.push({
            id: `seg-${idx++}`,
            type: 'latin',
            source: raw,
            target: raw,
          });
          i = closeIdx + 1;
          continue;
        }
      }

      const code = RU_TO_CODE.get(ch);
      if (code !== undefined) {
        segments.push({
          id: `seg-${idx++}`,
          type: 'cipher',
          source: ch,
          target: code,
          ruChar: ch.toLowerCase(),
          customCode: code,
        });
        i += 1;
        continue;
      }

      if (ch === ' ') {
        const target = eOpts.spaceMode === 'underscore' ? '_' : ' ';
        segments.push({
          id: `seg-${idx++}`,
          type: 'space',
          source: ' ',
          target,
        });
        i += 1;
        continue;
      }

      if (isLatinLetter(ch)) {
        let end = i + 1;
        while (end < input.length && isLatinWordChar(input[end])) {
          end += 1;
        }
        const run = input.slice(i, end);
        const target = eOpts.wrapLatin ? `[${run}]` : run;
        segments.push({
          id: `seg-${idx++}`,
          type: 'latin',
          source: run,
          target,
        });
        i = end;
        continue;
      }

      segments.push({
        id: `seg-${idx++}`,
        type: 'punct',
        source: ch,
        target: ch,
      });
      i += 1;
    }
  } else {
    while (i < input.length) {
      const ch = input[i];

      if (i + 1 < input.length) {
        const pair = input.slice(i, i + 2);
        const ru = CODE_TO_RU.get(pair) ?? CODE_TO_RU.get(pair.toLowerCase());
        if (ru !== undefined) {
          segments.push({
            id: `seg-${idx++}`,
            type: 'cipher',
            source: pair,
            target: ru,
            ruChar: ru,
            customCode: pair.toLowerCase(),
          });
          i += 2;
          continue;
        }
      }

      if (ch === '[') {
        const closeIdx = input.indexOf(']', i + 1);
        if (closeIdx !== -1) {
          const raw = input.slice(i, closeIdx + 1);
          const inner = input.slice(i + 1, closeIdx);
          segments.push({
            id: `seg-${idx++}`,
            type: 'latin',
            source: raw,
            target: dOpts.stripLatinBrackets ? inner : raw,
          });
          i = closeIdx + 1;
          continue;
        }
      }

      if (ch === '_' || ch === ' ') {
        segments.push({
          id: `seg-${idx++}`,
          type: 'space',
          source: ch,
          target: ' ',
        });
        i += 1;
        continue;
      }

      segments.push({
        id: `seg-${idx++}`,
        type: 'punct',
        source: ch,
        target: ch,
      });
      i += 1;
    }
  }

  return segments;
}

/**
 * Detects whether a given input string is primarily written in the custom layout
 * or in standard Russian text.
 */
export function detectInputMode(input: string): 'ru-to-custom' | 'custom-to-ru' {
  if (!input.trim()) return 'ru-to-custom';
  const cyrillicMatches = (input.match(/[а-яА-ЯёЁ]/g) || []).length;
  if (cyrillicMatches > 0) {
    return 'ru-to-custom';
  }
  // Count valid 2-char cipher tokens
  let cipherHits = 0;
  for (let i = 0; i < input.length - 1; i++) {
    const pair = input.slice(i, i + 2).toLowerCase();
    if (CODE_TO_RU.has(pair)) {
      cipherHits += 1;
      i += 1;
    }
  }
  return cipherHits > 0 ? 'custom-to-ru' : 'ru-to-custom';
}

export const SYSTEM_INSTRUCTION_SPEC = `=== СИСТЕМНАЯ ИНСТРУКЦИЯ ДЛЯ НЕЙРОСЕТИ ===
Ниже представлена таблица кастомной раскладки (шифра подстановки). 
Правило чтения: каждый символ или пара символов после знака «=» заменяет соответствующую русскую букву при вводе. При получении текста, написанного на этой раскладке, сначала переведи его по таблице обратно на русский язык, а затем обработай запрос. All English words and paths remain unchanged.

=== ТАБЛИЦА СИМВОЛОВ (РУС -> КАСТОМ) ===
А = q1
Б = w2
В = e3
Г = r4
Д = t5
Е = y6
Ё = y0
Ж = u7
З = i8
И = o9
Й = p0
К = a$
Л = s%
М = d^
Н = f&
О = g*
П = h(
Р = j)
С = k_
Т = l+
У = z=
Ф = x[
Х = c]
Ц = v{
Ч = b}
Ш = n|
Щ = m~
Ъ = <1
Ы = >2
Ь = ?3
Э = /4
Ю = :5
Я = ;6

=== ПРАВИЛА РАЗДЕЛЕНИЯ ===
1. Пробел между словами обозначается символом «_» или обычным пробелом.
2. Слова на латинице (например, названия папок, файлов или команд) заключаются в квадратные скобки: [mcp], [plugins], [rules].

=== ПРИМЕР ИСПОЛЬЗОВАНИЯ ===
Исходная фраза: «привет как дела»
Запись на кастомной раскладке: h(j)o9e3y6l+ a$q1a$ t5y6s%q1`;
