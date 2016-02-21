/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import QuizGenerator from '../quiz-generator.js';

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'material',
      'sources',
      'sections',
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
      m: 'material',
      t: 'texts',
      l: 'lemmatized',
      s: 'sections',
      S: 'size',
    },
    default: {
      instruction: 'Write down the meaning of underlined words/phrases.',
      wordRegExp: '[\\w\'-]+',  // need for display
    },
  });

  const material = argv.material;
  const sources = argv.sources;
  const sentenceSeparator =
    argv.sentenceSeparator && new RegExp(argv.sentenceSeparator, 'g');
  const clauseRegExp =
    argv.clauseRegExp && new RegExp(argv.clauseRegExp, 'g');
  const wordRegExp =
    argv.wordRegExp && new RegExp(argv.wordRegExp, 'g');
  const wordBoundaryRegExp =
    argv.wordBoundaryRegExp && new RegExp(argv.wordBoundaryRegExp);
  const abbrRegExp =
    argv.abbrRegExp && new RegExp(argv.abbrRegExp, 'g');
  const generator = new QuizGenerator({
    material, sources, sentenceSeparator, clauseRegExp, wordRegExp,
    wordBoundaryRegExp, abbrRegExp,
  });
  await generator.init();

  const sections = argv.sections;
  const size = Number(argv.size);
  const questions = await generator.quiz({ sections, size });

  console.log(colors.bold(argv.instruction));
  questions.forEach((q, i) => {
    const blockRegExp = new RegExp(`(${argv.wordRegExp})(\\s+)?`, 'g');
    let currentWordIndex = 0;

    console.log(
      `(${i + 1})\t` +
      q.sentence.replace(blockRegExp, (block, word, space = '') => {
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
