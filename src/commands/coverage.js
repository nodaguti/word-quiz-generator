/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import pad from 'pad/lib/colors';
import ProgressBar from 'progress';
import QuizGenerator from '../quiz-generator';

const showUsage = () => {
  console.log(
`word-quiz-generator coverage --help
word-quiz-generator coverage --material=<path> --sources=<paths> [--lang]
                             [--show-details] [--show-lemma]
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
-d, --show-details
    Show additional information such as the list of uncovered words/phrases.
--show-lemma
    Show lemmas of each phrase when a phrase and its lemma are different each other.
    This option helps you to detect phrases registered as non-lemma form,
    which may not be able to be found by the quiz generator and make the coverage lower.
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
      'show-details',
      'show-lemma',
      'help',
    ],
    alias: {
      m: 'material',
      s: 'sources',
      l: 'lang',
      d: 'show-details',
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
    material,
    sources,
    lang,
    sentenceSeparator,
    clauseRegExp,
    wordRegExp,
    wordBoundaryRegExp,
    abbrRegExp,
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

  const promises = phrases.map((phrase) => (async () => {
    const isCovered = !!(await generator.question(phrase));

    if (!isCovered) {
      uncovered.push(phrase);
    }

    progress.tick();
  })());

  await Promise.all(promises);

  const coverage = ((total - uncovered.length) * 100) / total;

  console.log(colors.bold(`Coverage: ${coverage.toFixed(2)}%`));

  if (argv['show-details']) {
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
  ${'Lemmas are shown only when you run with \'--show-lemma\' option.'.bold}
-----
`);

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const lemmatizer = require(`../lemmatizers/${argv.lang}.js`).default;
    const lookUpOriginalSources = (phrase) =>
      new Promise((resolve) => {
        Promise.all(generator._sources.map((source) => (async () => {
          const text = await source.getText();

          if (phrase.split('|').some((exp) => text.includes(exp))) {
            resolve(source);
          }
        })())).then(() => resolve(null));
      });

    uncovered.forEach((phrase) => (async () => {
      const [reference, lemma] = await Promise.all([
        (async () => {
          const source = await lookUpOriginalSources(phrase.phrase);
          const ref = source ? (await source.getReference()) : '';

          return ref;
        })(),
        (async () => {
          if (!argv['show-lemma']) {
            return Promise.resolve('');
          }

          return lemmatizer(phrase.phrase);
        })(),
      ]);

      const message = [];

      message.push(pad(2, colors.grey(phrase.section)));
      message.push(pad(phrase.phrase, 20));
      message.push(pad(colors.grey(phrase.answer), 20));
      message.push(pad(colors.green(reference), 10));
      message.push(colors.red(lemma !== phrase.phrase ? lemma : ''));

      console.log(message.join(' '));
    })());
  }
}
