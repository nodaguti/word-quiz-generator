/**
 * Lemmatizer for Classical Japanese using MeCab
 */
import path from 'path';
import MeCab from '../mecab';

const MECAB_WORD = 0;
const MECAB_LEMMA = 13;
const mecabHome = path.join(__dirname, '..', '..', 'vendor', 'mecab');
const mecabPath = path.join(mecabHome, 'mecab', 'bin', 'mecab');
const rcPath = path.join(mecabHome, 'unidic-ojp', '.mecabrc-ojp');
const mecab = new MeCab({ command: `${mecabPath} --rcfile=${rcPath}` });

export default async function (text) {
  const paragraphs = text.replace(/ /g, '').split(/\n/);

  const lemmatizedParagraphs = paragraphs.map((paragraph) => (async () => {
    const sentences = paragraph.split('。');

    const lemmatizedSentences = sentences.map((sentence) => (async () => {
      const parsed = await mecab.parse(sentence);
      const lemmatizedTokens = parsed
        .map((word) => (
          // '*' means there is no lemma data for this word.
          word[MECAB_LEMMA] && word[MECAB_LEMMA] !== '*' ?
            word[MECAB_LEMMA] :
            word[MECAB_WORD]
        ));

      return lemmatizedTokens.join(' ');
    })());

    return Promise.all(lemmatizedSentences).then((results) => results.join(' 。 '));
  })());

  return Promise.all(lemmatizedParagraphs).then((results) => results.join('\n'));
}
