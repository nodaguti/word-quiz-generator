/* eslint-disable no-console */
import path from 'path';
import { exec } from 'child_process';

const cli = path.resolve(__dirname, '../../../lib/cli.js');
const sourcesRoot = path.resolve(__dirname, '../../fixtures/sources/');

function compile(lang) {
  const sources = path.resolve(sourcesRoot, lang);

  return new Promise((resolve, reject) => {
    exec(`node ${cli} make --src=${sources} --lang=${lang}`, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

before(async () => {
  console.log('Preprocessing/lemmatizing the sources for tests...\n');
  await compile('en');
  await compile('ojp');
});
