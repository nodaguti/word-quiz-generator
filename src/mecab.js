import { exec } from 'child_process';
import sq from 'shell-quote';

/**
 * Customizable MeCab connector.
 */
export default class MeCab {
  /**
   * @param {string} command a command string to be executed via spawn.
   */
  constructor({ command = 'mecab' }) {
    this._command = command;
  }

  _getCommandStr(text) {
    const echoCommand = sq.quote(['echo', text]);
    return `${echoCommand} | ${this._command}`;
  }

  /**
   * Analyze a given text with MeCab.
   * @param {string} text a text string to be parsed.
   * @return {Promise<Array<Array<string>>}
   */
  parse(text) {
    return new Promise((resolve, reject) => {
      exec(this._getCommandStr(text), (err, result) => {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }

        const parsed = result.split('\n')
          .map((line) => line.replace(/\t/g, ',').split(','))
          .filter((line) => line.length >= 6);

        return resolve(parsed);
      });
    });
  }
}
