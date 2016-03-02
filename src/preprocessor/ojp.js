import path from 'path';
import _ from 'lodash';
import MeCab from '../mecab.js';

const MECAB_WORD = 0;
const mecabHome = path.join(__dirname, '..', '..', 'vendor', 'mecab');
const mecabPath = path.join(mecabHome, 'mecab', 'bin', 'mecab');
const rcPath = path.join(mecabHome, 'unidic-cj', '.mecabrc-cj');
const mecab = new MeCab({ command: `${mecabPath} --rcfile=${rcPath}` });

/**
 * Returns wakachigaki-style sentences.
 */
const wakatsu = async (text) => {
  const chunks = _.chunk(text.split(/\n/), 10);
  const results = [];

  for (const chunk of chunks) {
    const result = await Promise.all(chunk.map((paragraph) =>
      mecab.parse(paragraph).then((parsed) =>
        parsed.map((table) => table[MECAB_WORD]).join(' ')
      )
    )).then((items) => items.join('\n'));

    results.push(result);
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
