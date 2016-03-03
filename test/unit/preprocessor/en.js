/* eslint-env mocha */

import assert from 'power-assert';
import preprocessor from '../../../src/preprocessor/en.js';

describe('English preprocessor', () => {
  it('can remove unnecessary line breaks', async () => {
    const input = `abc
abc

abc1
abc`;
    const expect = 'abc abc abc1 abc';
    const output = await preprocessor(input);

    assert(output === expect);
  });

  it('can remove soft hyphens', async () => {
    const input = `hard-hyphen soft-
hyphen soft- hyphen soft-  hyphen`;
    const expect = 'hard-hyphen softhyphen softhyphen softhyphen';
    const output = await preprocessor(input);

    assert(output === expect);
  });

  it('can remove full-width apostrophes', async () => {
    const input = "'’’'";
    const expect = "''''";
    const output = await preprocessor(input);

    assert(output === expect);
  });

  it('can remove full-width quotation marks', async () => {
    const input = '"“”"';
    const expect = '""""';
    const output = await preprocessor(input);

    assert(output === expect);
  });
});
