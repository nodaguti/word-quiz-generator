/* eslint-disable no-console */
import path from 'path';
import minimist from 'minimist';
import Source from '../source.js';
import { fetchFileList } from '../utils.js';

const showUsage = () => {
  console.log('usage: word-quiz-generator make [--help] --src=<path> --lang=<lang>');
  console.log('Convert source text files into machine-processable form.');
  console.log('-h, --help: Show this help message.');
  console.log('-s, --src: Comma-separated path strings to be processed.');
  console.log('-l, --lang: Langage name in which source texts are written.');
};

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'src',
      'lang',
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
      lang: 'english',
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

  const preprocessor = require(`../preprocessor/${argv.lang}.js`).default;
  const lemmatizer = require(`../lemmatizer/${argv.lang}.js`).default;
  const files = await fetchFileList(argv.src, /\.txt$/);

  for (const _path of files) {
    console.log(_path);

    try {
      const source = new Source(_path);

      console.log('Preprocessing...');
      await source.preprocess(preprocessor);

      console.log('Lemmatizing...');
      await source.lemmatize(lemmatizer);
    } catch (ex) {
      console.error(ex.stack);
    }
  }
}
