/* eslint-disable no-console */
import path from 'path';
import { exec } from 'child_process';

const sourcePath = path.resolve(__dirname, '../../fixtures/sources/en/');

before((done) => {
  const cli = path.resolve(__dirname, '../../../lib/cli.js');
  exec(`node ${cli} make --src=${sourcePath} --lang=en`, done);
  console.log('Preprocessing/lemmatizing the sources for tests...\n');
});
