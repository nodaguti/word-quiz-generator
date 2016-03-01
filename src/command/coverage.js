/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import ProgressBar from 'progress';
import QuizGenerator from '../quiz-generator.js';

const showUsage = () => {
  console.log(
`word-quiz-generator coverage --help
word-quiz-generator coverage --material=<path> --sources=<paths> [--show-uncovered] [--sentenceSeparator=<RegExp>] [--clauseRegExp=<RegExp>] [--wordRegExp=<RegExp>] [--wordBoundaryRegExp=<RegExp>] [--abbrRegExp=<RegExp>]
Measure the coverage of words/phrases in the given material against the given sources.

-h, --help: Show this usage.
-m, --material=<path>: Path to a material.
-s, --sources=<paths>: Comma-separated path strings to sources.
-u, --show-uncovered: Show uncovered words/phrases.

The following options determines how to extract a word/phrase or sentence from a text.
For English sources, these are automatically set and usually don't need to override them.

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
      'sentenceSeparator',
      'clauseRegExp',
      'wordRegExp',
      'wordBoundaryRegExp',
      'abbrRegExp',
    ],
    boolean: [
      'show-uncovered',
      'help',
    ],
    alias: {
      m: 'material',
      s: 'sources',
      u: 'show-uncovered',
      h: 'help',
    },
  });

  if (argv.help) {
    showUsage();
    process.exit(0);
  }

  if (!argv.material || !argv.sources) {
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

  const phrases = generator._phrases;
  const total = phrases.length;
  const uncovered = [];
  const progress = new ProgressBar('[:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: phrases.length,
  });

  while (phrases.length) {
    const phrase = phrases.shift();
    const question = await generator.question(phrase);

    if (!question) {
      uncovered.push(phrase);
    }

    progress.tick();
  }

  const coverage = (total - uncovered.length) * 100 / total;

  console.log(colors.bold(`Coverage: ${coverage.toFixed(2)}%`));

  if (argv['show-uncovered']) {
    console.log(colors.bold('Uncovered Phrases'));
    console.log(uncovered);
  }
}
