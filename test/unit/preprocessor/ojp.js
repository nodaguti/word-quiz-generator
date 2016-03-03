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
      expect: `あう
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
      expect: 'ささみ 、 ひびわれ',
    });
  });

  it('can un-odorijify complex repeat marks', async () => {
    await assertOutput({
      func: preprocessor,
      input: 'かみ／〃＼、かみ＼〃／、さら／＼、さら＼／。',
      expect: 'かみがみ 、 かみがみ 、 さらさら 、 さらさら 。',
    });
  });

  it('can remove cornered brackets', async () => {
    await assertOutput({
      func: preprocessor,
      input: '｢」「」『』',
      expect: '',
    });
  });

  it('can remove full-width spaces', async () => {
    await assertOutput({
      func: preprocessor,
      input: '　',
      expect: '',
    });
  });
});
