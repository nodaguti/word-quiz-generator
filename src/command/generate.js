/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import { fetchFileList, loadPhraseList } from '../utils.js';
import QuizGenerator from '../quiz-generator.js';
import Source from '../model/source.js';

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'phrases',
      'texts',
      'lemmatized',
      'scope',
      'size',
      'instruction',
      'sentenceSeparator',
      'clauseRegExp',
      'wordRegExp',
      'wordBoundaryRegExp',
      'abbrRegExp',
    ],
    boolean: [
      'skip-spaces',
    ],
    alias: {
      p: 'phrases',
      t: 'texts',
      l: 'lemmatized',
      s: 'scope',
      S: 'size',
    },
    default: {
      'instruction': 'Write down the meaning of underlined words/phrases.',
      'wordRegExp': '[\\w\'-]+',  // need for display
    },
  });

  const phraseList = await loadPhraseList(argv.phrases);
  const texts = await fetchFileList(argv.texts, /\.txt$/);
  const lemmatized = await fetchFileList(argv.lemmatized, /\.txt$/);

  if (texts.length !== lemmatized.length) {
    console.error(`The number of files in the 'texts' dir and the 'lemmatized' dir are not identical. Please make sure you ran a preprocessor and lemmatizer successfully.`);
    process.exit(1);
  }

  const sources = texts.map((text, i) => {
    return new Source({
      original: text,
      lemmatized: lemmatized[i],
    });
  });
  const scope = argv.scope;
  const size = Number(argv.size);
  const generator = new QuizGenerator({
    phraseList,
    sources,
    sentenceSeparator:
      argv.sentenceSeparator && new RegExp(argv.sentenceSeparator, 'g'),
    clauseRegExp:
      argv.clauseRegExp && new RegExp(argv.clauseRegExp, 'g'),
    wordRegExp:
      argv.wordRegExp && new RegExp(argv.wordRegExp, 'g'),
    wordBoundaryRegExp:
      argv.wordBoundaryRegExp && new RegExp(argv.wordBoundaryRegExp),
    abbrRegExp:
      argv.abbrRegExp && new RegExp(argv.abbrRegExp, 'g'),
  });
  const questions = await generator.quiz({ scope, size });
  const wordRegExp = new RegExp(`(${argv.wordRegExp})(\\s+)?`, 'g');

  console.log(questions);

  console.log(colors.bold(argv.instruction));
  questions.forEach((q, i) => {
    let currentWordIndex = 0;

    console.log(
      `(${i + 1})\t` +
      q.sentence.replace(wordRegExp, (block, word, space = '') => {
        if (q.wordIndexes[0] === currentWordIndex) {
          q.wordIndexes.shift();
          currentWordIndex++;

          if (argv['skip-spaces']) {
            return colors.underline(word);
          }

          if (
            q.wordIndexes[0] && q.wordIndexes[0] === currentWordIndex
          ) {
            return colors.underline(block);
          }

          return colors.underline(word) + space;
        }

        currentWordIndex++;
        return argv['skip-spaces'] ? word : block;
      }) +
      `\t(${q.reference})`
    );
  });

  console.log(colors.bold('\nAnswer Keys'));
  questions.forEach((q, i) => {
    console.log(`(${i + 1})\t${q.answer}`);
  });
}
