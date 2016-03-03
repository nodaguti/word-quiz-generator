/* eslint-disable max-len */

import { assertOutput } from '../../utils';
import lemmatizer from '../../../src/lemmatizer/ojp.js';

describe('Old Japanese lemmatizer', () => {
  it('can get lemmas of words in normal sentences', async () => {
    await assertOutput({
      func: lemmatizer,
      input: '先 つ 頃 、 雲林 院 の 菩提 講 に 詣で て はべり しか ば 、 例 人 より は こよなう 年老い 、 うたて げ なる 翁 二人 、 嫗 と いき あひ て 、 同じ 所 に 居 ぬ まり 。あはれ に 、 同じ やう なる もの の さま かな と 見 はべり し に 、 これ ら うち 笑ひ 、 見 かはし て 言ふ やう 、',
      expect: '先 つ 頃 、 雲林 院 の 菩提 講 に 詣づ て はべり き ば 、 例 人 より は こよなし 年老ゆ 、 うたてし げ なり 翁 二人 、 嫗 と いく あふ て 、 同じ 所 に 居る ず まり 。 あはれ なり 、 同じ やう なり もの の さま かな と 見る はべり き に 、 これ ら うち 笑ふ 、 見る かはす て 言ふ やう 、',
    });
  });

  it('can properly treat a sentence containing "odoriji"', async () => {
    await assertOutput({
      func: lemmatizer,
      input: 'と も いは まほしけれ ど 、 いたく 人しげ げ れ ば 、 中 〱 あやしかり ぬ べし 。のぼり ざま に 、 よる など ゐ たまへ ら ん 所 に たづね ゆき て のどか に きこえ ん 。とて 、 過に けり 。',
      expect: 'と も いふ まほし ど 、 いたく 人しげし げ る ば 、 中 〱 あやし ぬ べし 。 のぼる ざま に 、 よる など ゐる たまふ り む 所 に たづぬ ゆく て のどか なり きこゆ む 。 とて 、 過ぬ けり 。 ',
    });
  });

  it('can distinguish "waka" from other sentences', async () => {
    await assertOutput({
      func: lemmatizer,
      input: `又 續 古今 の うた に 、
山田 もる そ うづ の 身 こそ あはれ なれ 秋 はて ぬれ ど とふ 人 も なし
これ も か の 玄 敏 の 歌 と 申 侍り 。`,
      expect: `又 續 古今 の うた に 、
山田 もる そ うづ の 身 こそ あはれ なり 秋 はつ ぬ ど とふ 人 も なし
これ も か の 玄 敏 の 歌 と 申す 侍り 。 `,
    });
  });
});
