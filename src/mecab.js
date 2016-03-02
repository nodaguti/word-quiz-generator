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
   * @param {Function} [callback] a callback function.
   * @return {Promise<Array<Array<string>>}
   * @note The user can receive a result via a callback function
   *       and a promise object.
   */
  parse(text, callback) {
    return new Promise((resolve, reject) => {
      exec(this._getCommandStr(text), (err, result) => {
        if (err) {
          reject(err);
          if (callback) {
            callback(err);
          }
          return;
        }

        const parsed = result.split('\n')
          .map((line) => line.replace(/\t/g, ',').split(','))
          .filter((line) => line.length >= 6);

        resolve(parsed);

        if (callback) {
          callback(err, parsed);
        }
      });
    });
  }
}
