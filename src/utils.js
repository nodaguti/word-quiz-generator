import fs from 'fs-extra-promise';
import csv from 'csv';
import path from 'path';
import flatten from 'lodash/flatten';

/**
 * Parse a material (CSV-formatted phrase list)
 * and return an array of Phrase object.
 * @param {string} csvPath Path to a CSV file.
 * @return {Promise<Array<Phrase>>}
 */
export const parseMaterial = (materialPath) =>
  new Promise((resolve, reject) => {
    const input = fs.createReadStream(materialPath);
    const parser = csv.parse();
    const transformer = csv.transform((record) => {
      const [section, phrase, answer, ..._] = record;
      return phrase ? { section: Number(section), phrase, answer, _ } : null;
    });
    const phraseList = [];

    input.pipe(parser)
      .pipe(transformer)
      .on('data', (row) => phraseList.push(row))
      .on('end', () => resolve(phraseList))
      .on('error', (err) => reject(err));
  });

/**
 * Fetch a list of all the files and directories
 * under the given comma-separated paths.
 * @param {string} paths comma-separated path strings
 * @param {RegExp} [pattern = /(?:)/] filtering regular expression
 * @return {Promise<Array<string>>}
 */
export const fetchFileList = (paths, pattern = /(?:)/) =>
  Promise.all(
    paths.split(',').map((p) => (async () => {
      const ap = path.resolve(p);
      const stat = await fs.statAsync(ap);

      if (stat.isDirectory()) {
        const ls = await fs.readdirAsync(ap);
        const arg = ls.map((name) => path.join(ap, name)).join(',');
        return fetchFileList(arg, pattern);
      }

      if (pattern.test(ap)) {
        return path.resolve(ap);
      }

      return [];
    })()),
  ).then((lists) => flatten(lists));
