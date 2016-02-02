/* eslint-disable no-console */
import 'source-map-support/register';
import path from 'path';
import _ from 'lodash';
import { fetchFileList } from './utils.js';

(async () => {
  const ls = await fetchFileList(path.join(__dirname, 'command'), /\.js$/);
  const commands = ls.map((p) => path.basename(p, '.js'));
  const cmdIdx = process.argv.findIndex((arg) => _.includes(commands, arg));

  if (cmdIdx >= 0) {
    const command = process.argv[cmdIdx];

    try {
      const func = require(`./command/${command}.js`).default;
      await func(process.argv.slice(cmdIdx + 1));
    } catch (err) {
      console.error(err.stack);
    }
  } else {
    console.log('usage: word-quiz-generator <command> [<args>]');
    console.log('available commands: ' + commands.join(', '));
  }
})();
