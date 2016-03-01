/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import QuizGenerator from '../quiz-generator.js';

const showUsage = () => {
  console.log(
`word-quiz-generator generate --help
word-quiz-generator generate --material=<path> --sources=<paths> --sections --size [--instruction] [--sentenceSeparator=<RegExp>] [--clauseRegExp=<RegExp>] [--wordRegExp=<RegExp>] [--wordBoundaryRegExp=<RegExp>] [--abbrRegExp=<RegExp>]
Generate a quiz and put it to stdout using the given material and sources.

-h, --help: Show this usage.
-m, --material=<path>: Path to a material.
-s, --sources=<paths>: Comma-separated path strings to sources.
-e, --sections=<sections>: Quiz coverage. e.g. '1-10', '5', '3-'
-i, --size=<num>: The number of questions.
--instruction: The instruction text located at top of the quiz. Default: 'Write down the meaning of underlined words/phrases.'
--skip-spaces: Specify if a language you want to make a quiz has no word divider, such as Japanese and Chinese.

The following options determines how to extract a word/phrase or sentence from a text.
For English quiz, these are automatically set and usually don't need to override them.

--sentenceSeparator=<RegExp>: Regular expression representing a sentence separator. Default: '(?:[?!.]\\s?)+"?(?:\\s|$)(?!,)'
--clauseRegExp=<RegExp>: Regular expression representing a clause. Default: '[^,:"?!.]+'
--wordRegExp=<RegExp>: Regular expression representing a word. Default: '[\\w'-]+'
--wordBoundaryRegExp=<RegExp>: Regular expression representing a word boundary. Default: '\\b'
--abbrRegExp=<RegExp>: Regular expression representing an abbreviation mark. Default: '\\.\\.\\.'
`);
};

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
      'help',
    ],
    alias: {
      m: 'material',
      s: 'sources',
      e: 'sections',
      i: 'size',
    },
    default: {
      instruction: 'Write down the meaning of underlined words/phrases.',
      wordRegExp: '[\\w\'-]+',  // need for display
    },
  });

  if (argv.help) {
    showUsage();
    process.exit(0);
  }

  if (!argv.material || !argv.sources || !argv.sections || !argv.size) {
    showUsage();
    process.exit(1);
  }

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
