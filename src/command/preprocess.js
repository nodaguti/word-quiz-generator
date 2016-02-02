/* eslint-disable no-console */
import fs from 'fs-extra-promise';
import minimist from 'minimist';
import { parseSource, fetchFileList } from '../utils.js';

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'src',
      'dist',
      'preprocessor',
    ],
    alias: {
      s: 'src',
      d: 'dist',
      p: 'preprocessor',
    },
    default: {
      'preprocessor': '../preprocessor/english.js',
    },
  });

  if (!argv.src || !argv.dist) {
    console.error('ERR: Both \'src\' and \'dist\' should be specified.');
    process.exit(1);
  }

  console.log(`Src: ${argv.src}`);
  console.log(`Dist: ${argv.dist}`);
  console.log(`Preprocessor: ${argv.preprocessor}`);

  await fs.removeAsync(argv.dist);
  await fs.copyAsync(argv.src, argv.dist);

  const preprocessor = require(argv.preprocessor).default;
  const fileList = await fetchFileList(argv.src, /\.txt$/);

  for (const path of fileList) {
    console.log(path);

    try {
      const content = await fs.readFileAsync(path, 'utf8');
      const { reference, text } = parseSource(content);
      const processed = await preprocessor(text);
      await fs.writeFileAsync(path, `${reference}\n${processed}`);
    } catch (ex) {
      console.error(ex.stack);
    }
  }
}
