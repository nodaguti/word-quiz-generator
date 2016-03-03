/* eslint-disable max-len */

import { assertOutput } from '../../utils';
import lemmatizer from '../../../src/lemmatizer/en.js';

describe('English lemmatizer', () => {
  it('can get lemmas of words in a normal sentence', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'There is two stores in this town.',
      expected: 'there be two store in this town .',
    });
  });

  it('can get lemmas of small numbers', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'In 2010 the government had 636 trillion yen of government debt.',
      expected: 'in 2010 the government have 636 trillion yen of government debt .',
    });
  });

  it('can get lemmas of big numbers', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'Rumour says the teacher won 12,345 doller in the competition.',
      expected: 'rumour say the teacher win 12,345 doller in the competition .',
    });
  });

  it('can get lemmas of titles and proper nouns', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'Mr. Tanaka screamed.',
      expected: 'Mr. Tanaka scream .',
    });
  });

  it('can get lemmas of personal pronouns', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'It is difficult that he made himself understood',
      expected: 'one be difficult that one make oneself understand',
    });
  });

  it('can get lemmas of possesive pronouns', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'These are my car, his car, her car, our cars, your cars, their cars, its car, respectively.',
      expected: "these be one's car , one's car , one's car , one's car , one's car , one's car , one's car , respectively .",
    });
  });

  it('can get lemmas of possesive nouns', async () => {
    await assertOutput({
      func: lemmatizer,
      input: "Mike's car, people's market, geeks's computer",
      expected: "one's car , one's market , one's computer",
    });
  });

  it('can get lemmas of abbreviation form of `be`, `have`, etc.', async () => {
    await assertOutput({
      func: lemmatizer,
      input: "It's nice. He's good. He's been to London. I'll go. I'd like to eat.",
      expected: "one'be nice . one'be good . one'have be to London . one'will go . one'will like to eat .",
    });
  });

  it('can get lemmas of signs', async () => {
    await assertOutput({
      func: lemmatizer,
      input: '"He is stupid," my uncle said, "and also very rude!"',
      expected: '" one be stupid , " one\'s uncle say , " and also very rude ! "',
    });
  });
});
