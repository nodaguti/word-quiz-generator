/* eslint-env mocha */

import assert from 'power-assert';
import preprocessor from '../../src/preprocessor/ojp.js';

describe('Old Japanese preprocessor', () => {
  it('can remove annotations', async () => {
    const input = `あ（い）う
あ（い)う
あ(い）う
あ(い)う
あ[い]う
あ［い］う
あ[い］う
あ［い]う
あ〔い〕う`;
    const expect = `あう
あう
あう
あう
あう
あう
あう
あう
あう`;
    const output = await preprocessor(input);

    assert(output === expect);
  });

  it('can correct substitutions of repeat marks', async () => {
    const input = 'かみ／〃＼、かみ＼〃／、さら／＼、さら＼／。';
    const expect = 'かみ 〲 、 かみ 〲 、 さら 〱 、 さら 〱 。';
    const output = await preprocessor(input);

    assert(output === expect);
  });
});
