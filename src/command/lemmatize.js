/* eslint-disable no-console */
import fs from 'fs-extra-promise';
import minimist from 'minimist';
import { parseSource, fetchFileList } from '../utils.js';

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'src',
      'dist',
      'lemmatizer',
    ],
    alias: {
      s: 'src',
      d: 'dist',
      l: 'lemmatizer',
    },
    default: {
      'lemmatizer': '../lemmatizer/english.js',
    },
  });

  if (!argv.src || !argv.dist) {
    console.error('ERR: both src and dist should be specified.');
    process.exit(1);
  }

  await fs.removeAsync(argv.dist);
  await fs.copyAsync(argv.src, argv.dist, { clobber: true });

  console.log(`Src: ${argv.src}`);
  console.log(`Dist: ${argv.dist}`);
  console.log(`Lemmatizer: ${argv.lemmatizer}`);

  const lemmatizer = require(argv.lemmatizer).default;
  const fileList = await fetchFileList(argv.src, /\.txt$/);

  for (const path of fileList) {
    console.log(path);

    try {
      const content = await fs.readFileAsync(path, 'utf8');
      const { reference, text } = parseSource(content);
      const lemmatized = await lemmatizer(text);
      await fs.writeFileAsync(path, `${reference}\n${lemmatized}`);
    } catch (ex) {
      console.error(ex.stack);
    }
  }
}
