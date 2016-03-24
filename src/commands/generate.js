/* eslint-disable no-console */
import minimist from 'minimist';
import colors from 'colors';
import QuizGenerator from '../quiz-generator.js';

const showUsage = () => {
  console.log(
`word-quiz-generator generate --help
word-quiz-generator generate --material=<path> --sources=<paths> --sections --size
                             [--instruction] [--lang] [--sentenceSeparator=<RegExp>]
                             [--clauseRegExp=<RegExp>] [--wordRegExp=<RegExp>]
                             [--wordBoundaryRegExp=<RegExp>] [--abbrRegExp=<RegExp>]

Generate a quiz and put it to stdout using the given material and sources.

-h, --help
    Show this usage.
-m, --material=<path>
    Path to a material.
-s, --sources=<paths>
    Comma-separated path strings to sources.
-e, --sections=<sections>
    Quiz coverage. e.g. '1-10', '5', '3-'
-i, --size=<num>
    The number of questions.
-l, --lang=<lang>
    IETF langage tag in which the material are written.
    This determines how to extract a word/phrase or sentence from a text.
    If you need more precise control over the extraction algorithm,
    please use '--sentenceSeparator', '--clauseRegExp', '--wordRegExp',
    '--wordBoundaryRegExp', and/or '--abbrRegExp' to override.
    Default: 'en' (English)
--instruction
    The instruction text located at top of the quiz.
    Default: 'Write down the meaning of underlined words/phrases.'
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
      'sections',
      'size',
      'instruction',
      'lang',
      'sentenceSeparator',
      'clauseRegExp',
      'wordRegExp',
      'wordBoundaryRegExp',
      'abbrRegExp',
    ],
    boolean: [
      'help',
    ],
    alias: {
      m: 'material',
      s: 'sources',
      l: 'lang',
      e: 'sections',
      i: 'size',
    },
    default: {
      instruction: 'Write down the meaning of underlined words/phrases.',
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
  const lang = argv.lang;
  const sentenceSeparator =
    argv.sentenceSeparator &&
    new RegExp(argv.sentenceSeparator, 'g');
  const clauseRegExp =
    argv.clauseRegExp &&
    new RegExp(argv.clauseRegExp, 'g');
  const wordRegExp =
    argv.wordRegExp &&
    new RegExp(argv.wordRegExp, 'g');
  const wordBoundaryRegExp =
    argv.wordBoundaryRegExp &&
    new RegExp(argv.wordBoundaryRegExp);
  const abbrRegExp =
    argv.abbrRegExp &&
    new RegExp(argv.abbrRegExp, 'g');

  const generator = new QuizGenerator({
    material, sources, lang, sentenceSeparator, clauseRegExp, wordRegExp,
    wordBoundaryRegExp, abbrRegExp,
  });
  await generator.init();

  const sections = argv.sections;
  const size = Number(argv.size);

  // generate
  const questions = await generator.quiz({ sections, size });

  // instruction
  console.log(colors.bold(argv.instruction));

  // questions
  questions.forEach((question, i) => {
    const index = i + 1;
    const decoratedSentence = [];
    const { body, reference } = question;

    // Set underlines to question parts.
    // eslint-disable-next-line no-cond-assign
    body.forEach(({ text, isQuestionPart }) => {
      if (isQuestionPart) {
        decoratedSentence.push(colors.underline(text));
      } else {
        decoratedSentence.push(text);
      }
    });

    console.log(`(${index})\t${decoratedSentence.join('')}\t(${reference})`);
  });

  // title in answers section
  console.log(colors.bold('\nAnswer Keys'));

  // answers
  questions.forEach((q, i) => {
    console.log(`(${i + 1})\t${q.answer}`);
  });
}
