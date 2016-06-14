/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import pad from 'pad/lib/colors';
import ProgressBar from 'progress';
import QuizGenerator from '../quiz-generator.js';

const showUsage = () => {
  console.log(
`word-quiz-generator coverage --help
word-quiz-generator coverage --material=<path> --sources=<paths> [--lang]
                             [--display-details] [--display-lemmas]
                             [--sentenceSeparator=<RegExp>] [--clauseRegExp=<RegExp>]
                             [--wordRegExp=<RegExp>] [--wordBoundaryRegExp=<RegExp>]
                             [--abbrRegExp=<RegExp>]

Measure the coverage of words/phrases in the given material against the given sources.

-h, --help
    Show this usage.
-m, --material=<path>
    Path to a material.
-s, --sources=<paths>
    Comma-separated path strings to sources.
-l, --lang=<lang>
    IETF langage tag in which the material are written.
    This determines how to extract a word/phrase or sentence from a text.
    If you need more precise control over the extraction algorithm,
    please use '--sentenceSeparator', '--clauseRegExp', '--wordRegExp',
    '--wordBoundaryRegExp', and/or '--abbrRegExp' to override.
    Default: 'en' (English)
-d, --display-details
    Show more information about the results, such as the list of
    uncovered words/phrases, suggestions to improve the coverage, etc.
--display-lemmas
    Show lemmas of phrases in the suggestions discribed above.
    This option is separated from '--display-details'
    because it is extremely slow when trying to display lemmas of English using TreeTagger :/
--sentenceSeparator=<RegExp>
    Regular expression representing a sentence separator.
--clauseRegExp=<RegExp>
    Regular expression representing a clause.
--wordRegExp=<RegExp>
    Regular expression representing a word.
--wordBoundaryRegExp=<RegExp>
    Regular expression representing a word boundary.
--abbrRegExp=<RegExp>
    Regular expression representing an abbreviation mark.`);
};

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'material',
      'sources',
      'lang',
      'sentenceSeparator',
      'clauseRegExp',
      'wordRegExp',
      'wordBoundaryRegExp',
      'abbrRegExp',
    ],
    boolean: [
      'display-details',
      'display-lemmas',
      'help',
    ],
    alias: {
      m: 'material',
      s: 'sources',
      l: 'lang',
      d: 'display-details',
      h: 'help',
    },
    default: {
      lang: 'en',
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
  const lang = argv.lang;
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
    material, sources, lang, sentenceSeparator, clauseRegExp, wordRegExp,
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

  if (argv['display-details']) {
    console.log(colors.bold('\nUncovered Phrases'));

    console.log(`
-----
Legend: ${'#'.grey} phrase ${'answer'.grey} ${'reference'.green} ${'lemmas'.red}

- A reference name is shown if a phrase is found in an original version of source,
  which means you may somehow make the phrase detectable from the generator,
  such as by turning them into their lemmas.

- Lemmas of a phrase are shown if they are different from an original phrase,
  which indicates the phrase is shown here because they are stored in natural form
  and not recognizable to the generator.
  ${'Lemmas are shown only when you run with \'--display-lemmas\' option.'.bold}
-----
`);

    // eslint-disable-next-line global-require
    const lemmatizer = require(`../lemmatizers/${argv.lang}.js`).default;
    const findWithinOriginals = async (phrase) => {
      for (const source of generator._sources) {
        const text = await source.getText();

        if (phrase.split('|').some((exp) => text.includes(exp))) {
          return source;
        }
      }

      return null;
    };

    for (const phrase of uncovered) {
      const source = await findWithinOriginals(phrase.phrase);
      const message = [];

      message.push(pad(2, colors.grey(phrase.section)));
      message.push(pad(phrase.phrase, 20));
      message.push(pad(colors.grey(phrase.answer), 20));

      if (source) {
        const ref = await source.getReference();
        message.push(pad(colors.green(ref), 10));
      } else {
        message.push(pad('', 10));
      }

      if (argv['display-lemmas']) {
        const lemma = await lemmatizer(phrase.phrase);

        if (lemma !== phrase.phrase) {
          message.push(colors.red(lemma));
        }
      }

      console.log(message.join(' '));
    }
  }
}
