import path from 'path';
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

export default async function (text) {
  const emended = text
    // Remove annotations.
    .replace(/(?:\(|（).*?(?:\)|）)/g, '')
    .replace(/(?:\[|［).*?(?:\]|］)/g, '')
    .replace(/〔.*?〕/g, '')

    // Replace substitutions of repeat marks with their unicode characters.
    .replace(/／〃＼/g, '〲')
    .replace(/＼〃／/g, '〲')
    .replace(/／＼/g, '〱')
    .replace(/＼／/g, '〱')

    // Un-odorijify
    .replace(/(.)ゝ/g, '$1$1')
    .replace(/(.)ゞ/g, (__, prev) => `${prev}${toVoicedChar(prev)}`)

    // Replace some half-width signs with their full-width ones.
    .replace(/｢/g, '「')
    .replace(/｣/g, '」')

    // Remove brackets to make a question sentence tidy.
    .replace(/「/g, '')
    .replace(/」/g, '')
    .replace(/『/g, '')
    .replace(/』/g, '')
    .replace(/｛/g, '')
    .replace(/｝/g, '')

    // Remove full-width spaces
    // eslint-disable-next-line no-irregular-whitespace
    .replace(/　/g, '');

  // Un-odorijify
  const unodorijified = await transform(emended, (table, i, parsed) => {
    const word = table[MECAB_WORD];

    // un-odorijify
    if (word.startsWith('〱')) {
      const prev = parsed[i - 1][MECAB_WORD];

      if (prev.length >= 2) {
        return word.replace(/〱/, prev);
      }
    }

    // Un-odorijify
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

  // Separate each words with a half-width space (wakachigaki)
  // to enable QuizGenerator to detect word boundaries easily.
  const wakachigaki = await transform(unodorijified, (table) =>
    `${table[MECAB_WORD]} `
  );

  // Remove trailing spaces
  return wakachigaki.replace(/ $/mg, '');
}
