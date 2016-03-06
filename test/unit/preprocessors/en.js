import { assertOutput } from '../../_helpers';
import preprocessor from '../../../src/preprocessors/en';

describe('English preprocessor', () => {
  it('can remove unnecessary line breaks', async () => {
    await assertOutput({
      func: preprocessor,
      input: `abc
abc

abc1
abc`,
      expected: 'abc abc abc1 abc',
    });
  });

  it('can remove soft hyphens', async () => {
    await assertOutput({
      func: preprocessor,
      input: `hard-hyphen soft-
hyphen soft- hyphen soft-  hyphen`,
      expected: 'hard-hyphen softhyphen softhyphen softhyphen',
    });
  });

  it('can remove full-width apostrophes', async () => {
    await assertOutput({
      func: preprocessor,
      input: "'’’'",
      expected: "''''",
    });
  });

  it('can remove full-width quotation marks', async () => {
    await assertOutput({
      func: preprocessor,
      input: '"“”"',
      expected: '""""',
    });
  });
});
