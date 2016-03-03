import { assertOutput } from '../../utils';
import preprocessor from '../../../src/preprocessor/ojp';

describe('Old Japanese preprocessor', () => {
  it('can remove annotations', async () => {
    await assertOutput({
      func: preprocessor,
      input: `あ（い）う
あ（い)う
あ(い）う
あ(い)う
あ[い]う
あ［い］う
あ[い］う
あ［い]う
あ〔い〕う`,
      expected: `あう
あう
あう
あう
あう
あう
あう
あう
あう`,
    });
  });

  it('can un-odorijify simple repeat marks', async () => {
    await assertOutput({
      func: preprocessor,
      input: 'さゝみ、ひゞわれ',
      expected: 'ささみ 、 ひびわれ',
    });
  });

  it('can un-odorijify complex repeat marks', async () => {
    await assertOutput({
      func: preprocessor,
      input: 'かみ／〃＼、かみ＼〃／、さら／＼、さら＼／。',
      expected: 'かみがみ 、 かみがみ 、 さらさら 、 さらさら 。',
    });
  });

  it('can remove brackets', async () => {
    await assertOutput({
      func: preprocessor,
      input: '｢」「」『』｛｝',
      expected: '',
    });
  });

  it('can remove full-width spaces', async () => {
    await assertOutput({
      func: preprocessor,
      input: '　',
      expected: '',
    });
  });
});
