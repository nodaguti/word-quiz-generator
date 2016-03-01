/* eslint-disable no-console */
import path from 'path';
import minimist from 'minimist';
import Source from '../source.js';
import { fetchFileList } from '../utils.js';

const showUsage = () => {
  console.log(
`word-quiz-generator make --help
word-quiz-generator make --src=<path> --lang=<lang>
ord-quiz-generator make --src=<path> [--preprocessor=<path>] [--lemmatizer=<path>]
Generate preprocessed and lemmatized texts from the given sources.

-h, --help: Show this usage.
-s, --src=<paths>: Comma-separated path strings to be processed.
-l, --lang=<lang>: IETF langage tag in which source texts are written. This determines which built-in preprocesser and lemmatizer should be used. If you want to use your custom ones, please use '--preprocessor' and '--lemmatizer' options.
--preprocessor=<path>: Path to a custom preprocessor.
--lemmatizer=<path>: Path to a custom lemmatizer.`);
};

const getPreprocessor = (argv) => {
  try {
    if (argv.preprocessor) {
      const preprocessor = require(argv.preprocessor);
      return preprocessor.default || preprocessor;
    } else if (argv.lang) {
      return require(`../preprocessor/${argv.lang}.js`).default;
    }
  } catch (err) {
    console.error('Unable to load the preprocessor: %c', err.message);
  }

  return null;
};

const getLemmatizer = (argv) => {
  try {
    if (argv.lemmatizer) {
      const lemmatizer = require(argv.lemmatizer);
      return lemmatizer.default || lemmatizer;
    } else if (argv.lang) {
      return require(`../lemmatizer/${argv.lang}.js`).default;
    }
  } catch (err) {
    console.error('Unable to load the lemmatizer: %c', err.message);
  }

  return null;
};

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'src',
      'lang',
      'preprocessor',
      'lemmatizer',
    ],
    boolean: [
      'help',
    ],
    alias: {
      s: 'src',
      l: 'lang',
      h: 'help',
    },
    default: {
      lang: 'en',
      help: false,
    },
  });

  if (argv.help) {
    showUsage();
    process.exit(0);
  }

  if (!argv.src) {
    console.error('ERR: No src is specified.');
    showUsage();
    process.exit(1);
  }

  console.log(`Src: ${path.resolve(argv.src)}`);

  const preprocessor = getPreprocessor(argv);
  const lemmatizer = getLemmatizer(argv);
  const files = await fetchFileList(argv.src, /\.txt$/);

  for (const _path of files) {
    console.log(_path);

    try {
      const source = new Source(_path);

      if (preprocessor) {
        console.log('Preprocessing...');
        await source.preprocess(preprocessor);
      }

      if (lemmatizer) {
        console.log('Lemmatizing...');
        await source.lemmatize(lemmatizer);
      }
    } catch (ex) {
      console.error(ex.stack);
    }
  }
}
