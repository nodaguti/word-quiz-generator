/**
 * Lemmatizer for Classical Japanese using MeCab
 */
import MeCab from '../mecab.js';
import path from 'path';

const MECAB_WORD = 0;
const MECAB_LEMMA = 13;
const mecabHome = path.join(__dirname, '..', '..', 'vendor', 'mecab');
const mecabPath = path.join(mecabHome, 'mecab', 'bin', 'mecab');
const rcPath = path.join(mecabHome, 'unidic-ojp', '.mecabrc-ojp');
const mecab = new MeCab({ command: `${mecabPath} --rcfile=${rcPath}` });

export default async function (text) {
  const chunks = text
    .replace(/ /g, '')
    .split(/\n/)
    .map((block) => block.split(/。/));
  const lemmatizedChunks = [];

  for (const chunk of chunks) {
    const results = [];

    for (const sentence of chunk) {
      const parsed = await mecab.parse(sentence);
      const lemmatized = parsed
        .map((word) => (
          // '*' means there is no lemma data for this word.
          word[MECAB_LEMMA] && word[MECAB_LEMMA] !== '*' ?
            word[MECAB_LEMMA] :
            word[MECAB_WORD]
        ))
        .join(' ');

      results.push(lemmatized);
    }

    lemmatizedChunks.push(results.join(' 。 '));
  }

  return lemmatizedChunks.join('\n');
}
