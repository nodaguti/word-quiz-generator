import path from 'path';
import MeCab from '../mecab.js';

const MECAB_WORD = 0;
const mecabHome = path.join(__dirname, '..', '..', 'vendor', 'mecab');
const mecabPath = path.join(mecabHome, 'mecab', 'bin', 'mecab');
const rcPath = path.join(mecabHome, 'unidic-ojp', '.mecabrc-ojp');
const mecab = new MeCab({ command: `${mecabPath} --rcfile=${rcPath}` });

/**
 * Returns wakachigaki-style sentences.
 */
const wakatsu = async (text) => {
  const chunks = text.split(/\n/).map((block) => block.split(/。/));
  const results = [];

  for (const chunk of chunks) {
    const result = [];

    for (const sentence of chunk) {
      const parsed = await mecab.parse(sentence);
      result.push(parsed.map((table) => table[MECAB_WORD]).join(' '));
    }

    results.push(result.join(' 。 '));
  }

  return results.join('\n');
};

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

    // Replace some half-width signs with their full-width ones.
    .replace(/｢/g, '「')
    .replace(/｣/g, '」')

    // Remove cornered brackets to make a question sentence look nice.
    .replace(/「/g, '')
    .replace(/」/g, '')
    .replace(/『/g, '')
    .replace(/』/g, '');

  // Separate each words with a half-width space
  // to enable QuizGenerator to determine word boundaries easily.
  const wakachigaki = await wakatsu(emended);

  return wakachigaki;
}
