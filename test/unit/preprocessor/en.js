import { assertOutput } from '../../utils';
import preprocessor from '../../../src/preprocessor/en.js';

describe('English preprocessor', () => {
  it('can remove unnecessary line breaks', async () => {
    await assertOutput({
      func: preprocessor,
      input: `abc
abc

abc1
abc`,
      expect: 'abc abc abc1 abc',
    });
  });

  it('can remove soft hyphens', async () => {
    await assertOutput({
      func: preprocessor,
      input: `hard-hyphen soft-
hyphen soft- hyphen soft-  hyphen`,
      expect: 'hard-hyphen softhyphen softhyphen softhyphen',
    });
  });

  it('can remove full-width apostrophes', async () => {
    await assertOutput({
      func: preprocessor,
      input: "'’’'",
      expect: "''''",
    });
  });

  it('can remove full-width quotation marks', async () => {
    await assertOutput({
      func: preprocessor,
      input: '"“”"',
      expect: '""""',
    });
  });
});
