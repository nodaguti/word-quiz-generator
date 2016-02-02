/**
 * Lemmatizer for Classical Japanese using MeCab
 */
import MeCab from '../mecab.js';
import path from 'path';
import _ from 'lodash';

const MECAB_WORD = 0;
const MECAB_LEMMA = 13;
const mecabHome = path.join(__dirname, '..', '..', 'vendor', 'mecab');
const mecabPath = path.join(mecabHome, 'mecab', 'bin', 'mecab');
const rcPath = path.join(mecabHome, 'unidic-cj', '.mecabrc-cj');
const mecab = new MeCab({ command: `${mecabPath} --rcfile=${rcPath}` });

export default async function (text) {
  const chunks = _.chunk(text.replace(/ /g, '').split(/\n/), 10);
  const lemmatizedChunks = [];

  for (const chunk of chunks) {
    const lemmatized = await Promise.all(chunk.map((paragraph) =>
      mecab.parse(paragraph).then((results) =>
        results.map((parsed) =>
          // '*' means there is no lemma data for this word.
          parsed[MECAB_LEMMA] !== '*' ?
            parsed[MECAB_LEMMA] :
            parsed[MECAB_WORD]
        ).join(' ')
      )
    )).then((results) => results.join('\n'));

    lemmatizedChunks.push(lemmatized);
  }

  return lemmatizedChunks.join('\n');
}
