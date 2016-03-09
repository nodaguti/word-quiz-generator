import path from 'path';
import XRegExp from 'xregexp';
import MeCab from '../mecab.js';

const MECAB_WORD = 0;
const mecabHome = path.join(__dirname, '..', '..', 'vendor', 'mecab');
const mecabPath = path.join(mecabHome, 'mecab', 'bin', 'mecab');
const rcPath = path.join(mecabHome, 'unidic-ojp', '.mecabrc-ojp');
const mecab = new MeCab({ command: `${mecabPath} --rcfile=${rcPath}` });

function toVoicedChar(char) {
  const unvoiced = 'かきくけこさしすせそたちつてとはひふへほ';
  const voiced = 'がぎぐげござじずぜぞだじづでどばびぶべぼ';
  const index = unvoiced.indexOf(char);

  return index < 0 ? char : voiced[index];
}

/**
 * Apply transformer to every tokens extracted from a text by Mecab
 * @param {string} text a target text
 * @param {Function<Promise<string>>} transformer
 * @return {string} transformed text
 */
async function transform(text, transformer) {
  const chunks = text.split(/\n/).map((block) => block.split(/。/));
  const results = [];

  for (const chunk of chunks) {
    const result = [];

    for (const sentence of chunk) {
      const parsed = await mecab.parse(sentence);
      const transformed = parsed.map(transformer);

      result.push(transformed.join(''));
    }

    results.push(result.join('。'));
  }

  return results.join('\n');
}

function removeAnnotations(text) {
  /**
   * Remove a string between `left` and `right` using recursive RegExp.
   * @param {string} str a target string
   * @param {string} left left delimiter
   * @param {string} right right delimiter
   * @return {string}
   */
  const removeBetween = (str, left, right) => {
    const outsides = XRegExp.matchRecursive(str, left, right, 'g', {
      valueNames: ['outside', null, null, null],
    });

    return outsides.map((outside) => outside.value).join('');
  };

  // ---- Replace full-width brackets with their half-width ones.
  let _text = text
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/［/g, '[')
    .replace(/］/g, ']')
    .replace(/｛/g, '{')
    .replace(/｝/g, '}');

  // --- Remove annotations.
  const brackets = [
    ['\\(', '\\)'],
    ['\\[', '\\]'],
    ['\\{', '\\}'],
    ['〔', '〕'],
    ['【', '】'],
  ];

  brackets.forEach((pair) => {
    try {
      _text = removeBetween(_text, ...pair);
    } catch (err) {
      // Fallback
      // if brackets are not properly paired,
      // try to remove the most appropriate parts of the text.
      const [left, right] = pair;

      _text = _text.replace(new RegExp(`${left}.*?${right}`, 'g'), '');
      _text = _text.replace(new RegExp(`(?:${left}|${right})`, 'g'), '');
    }
  });

  return _text;
}

export default async function (text) {
  // ---- Remove annotations
  const textWithoutAnnotations = removeAnnotations(text);

  const emended = textWithoutAnnotations
    // --- Replace substitutions of repeat marks with their unicode characters.
    .replace(/／〃＼/g, '〲')
    .replace(/＼〃／/g, '〲')
    .replace(/／＼/g, '〱')
    .replace(/＼／/g, '〱')

    // --- Un-odorijify (single character repetition)
    .replace(/(.)ゝ/g, '$1$1')
    .replace(/(.)ゞ/g, (__, prev) => `${prev}${toVoicedChar(prev)}`)

    // --- Remove brackets to make a question sentence tidy.

    // Replace some half-width signs with their full-width ones.
    .replace(/｢/g, '「')
    .replace(/｣/g, '」')

    // Remove brackets
    .replace(/(?:「|」|『|』)/g, '')

    // --- Remove full-width spaces
    // eslint-disable-next-line no-irregular-whitespace
    .replace(/　/g, '');

  // --- Un-odorijify (multi characters repetition)
  const unodorijified = await transform(emended, (table, i, parsed) => {
    const word = table[MECAB_WORD];

    // un-odorijify (unvoiced)
    if (word.startsWith('〱')) {
      const prev = parsed[i - 1][MECAB_WORD];

      if (prev.length >= 2) {
        return word.replace(/〱/, prev);
      }
    }

    // Un-odorijify (voiced)
    if (word.startsWith('〲')) {
      const prev = parsed[i - 1][MECAB_WORD];

      if (prev.length >= 2) {
        return word.replace(
          /〲/,
          `${toVoicedChar(prev[0])}${prev.substring(1)}`
        );
      }
    }

    return word;
  });

  // --- Wakachigaki
  // Separate each words with a half-width space (wakachigaki)
  // to enable QuizGenerator to detect word boundaries easily.
  const wakachigaki = await transform(unodorijified, (table) =>
    `${table[MECAB_WORD]} `
  );

  // --- Remove trailing spaces
  return wakachigaki.replace(/ $/mg, '');
}
