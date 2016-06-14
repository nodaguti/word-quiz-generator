import assert from 'power-assert';
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

  it('can shorten repeating whitespaces into a single space', async () => {
    await assertOutput({
      func: preprocessor,
      input: 'a      b  c',
      expected: 'a b c',
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

  it('can convert full-width apostrophes', async () => {
    await assertOutput({
      func: preprocessor,
      input: "'‘’'",
      expected: "''''",
    });
  });

  it('can convert full-width quotation marks', async () => {
    await assertOutput({
      func: preprocessor,
      input: '"“”"',
      expected: '""""',
    });
  });

  it('can convert full-width dash', async () => {
    await assertOutput({
      func: preprocessor,
      input: '—',
      expected: '--',
    });
  });

  it('can split sentences', async () => {
    // The following sentences are quoted from
    // http://tech.grammarly.com/blog/posts/How-to-Split-Sentences.html
    // eslint-disable-next-line max-len
    const input = 'At some schools, even professionals boasting Ph.D. degrees are coming back to school for Master\'s degrees. Wang first asked: "Are you sure you want the original inscription ground off?" Without thinking twice about it, Huang said yes.';
    const output = await preprocessor(input);
    assert(output.split(/\n/).length === 3);
  });
});
