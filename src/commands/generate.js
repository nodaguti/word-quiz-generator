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
--skip-spaces
    Specify if a language you want to make a quiz has no word divider, such as Japanese and Chinese.
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
      'skip-spaces',
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

  const sections = argv.sections;
  const size = Number(argv.size);
  const questions = await generator.quiz({ sections, size });

  console.log(colors.bold(argv.instruction));
  questions.forEach((question, i) => {
    const sentenceParts = [];
    const _wordRegExp = generator._wordRegExp.source;
    const blockRegExp = new RegExp(`(${_wordRegExp})(\\s+)?`, 'g');
    const { sentence, wordIndexes } = question;
    const divider = argv['skip-spaces'] ? '' : ' ';
    let currentWordIndex = 0;
    let prevLastIndex = 0;
    let matched;

    // Set underlines at target expressions.
    // eslint-disable-next-line no-cond-assign
    while ((matched = blockRegExp.exec(sentence))) {
      const [, word, hasDivider] = matched;
      const divider_ = !!hasDivider ? divider : '';
      const punctuation = sentence.substring(prevLastIndex, matched.index);

      if (wordIndexes[0] === currentWordIndex) {
        const isSuccessive = (wordIndexes[0] + 1) === wordIndexes[1];

        if (isSuccessive) {
          sentenceParts.push(`${punctuation}${colors.underline(`${word}${divider_}`)}`);
        } else {
          sentenceParts.push(`${punctuation}${colors.underline(word)}${divider_}`);
        }

        wordIndexes.shift();
      } else {
        sentenceParts.push(`${punctuation}${word}${divider_}`);
      }

      currentWordIndex++;
      prevLastIndex = blockRegExp.lastIndex;
    }

    const stopPunctuation = sentence.substring(prevLastIndex);
    sentenceParts.push(stopPunctuation);

    console.log(`(${i + 1})\t${sentenceParts.join('')}\t(${question.reference})`);
  });

  console.log(colors.bold('\nAnswer Keys'));
  questions.forEach((q, i) => {
    console.log(`(${i + 1})\t${q.answer}`);
  });
}
