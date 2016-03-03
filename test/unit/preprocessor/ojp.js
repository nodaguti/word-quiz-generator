import assert from 'power-assert';
import preprocessor from '../../../src/preprocessor/ojp.js';

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

  it('can un-odorijify simple repeat marks', async () => {
    const input = 'さゝみ、ひゞわれ';
    const expect = 'ささみ 、 ひびわれ';
    const output = await preprocessor(input);

    assert(output === expect);
  });

  it('can un-odorijify complex repeat marks', async () => {
    const input = 'かみ／〃＼、かみ＼〃／、さら／＼、さら＼／。';
    const expect = 'かみがみ 、 かみがみ 、 さらさら 、 さらさら 。';
    const output = await preprocessor(input);

    assert(output === expect);
  });

  it('can remove cornered brackets', async () => {
    const input = '｢」「」『』';
    const expect = '';
    const output = await preprocessor(input);

    assert(output === expect);
  });
});
