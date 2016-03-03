/* eslint-disable max-len */

import { assertOutput } from '../../utils';
import lemmatizer from '../../../src/lemmatizer/ojp.js';

describe('Old Japanese lemmatizer', () => {
  it('can get lemmas of words in normal sentences', async () => {
    await assertOutput({
      func: lemmatizer,
      input: '世 に 宇治 拾遺 物語 と いふ 物 あり 。こ の 大 納言 は 隆国 と いふ 人 なり 。西宮 殿 の 孫 、 俊賢 大 納言 の 第 二 の 男 なり 。と した こう なり て は 、 暑 さ を わび て 暇 を 申し て 、 五月 より 八月 まで は 平等 院 一切 経蔵 の 南 の 山ぎは に 、 南泉 房 と いふ 所 に 籠り ゐ られ けり 。',
      expect: '世 に 宇治 拾遺 物語 と いふ 物 あり 。 こ の 大 納言 は 隆国 と いふ 人 なり 。 西宮 殿 の 孫 、 俊賢 大 納言 の 第 二 の 男 なり 。 と した こし なる て は 、 暑し さ を わぶ て 暇 を 申す て 、 五月 より 八月 まで は 平等 院 一切 経蔵 の 南 の 山ぎは に 、 南泉 房 と いふ 所 に 籠る ゐる らる けり 。 ',
    });
  });

  it('can properly treat a sentence containing "odoriji"', async () => {
    await assertOutput({
      func: lemmatizer,
      input: '大方やう〱さま〲なる者ども、赤き色には青き物を着、黒き色には赤き物を褌にかき、大方目一つある者あり',
      expect: '大方 やう 〱 さま 〲 なり 者 ども 、 赤し 色 に は 青し 物 を 着る 、 黒し 色 に は 赤し 物 を 褌 に かく 、 大方 目 一 つ あり 者 あり',
    });
  });

  it('can distinguish "waka" from other sentences', async () => {
    await assertOutput({
      func: lemmatizer,
      input: `四条大納言歌に、
春来てぞ人も訪ひける山里は花こそ宿のあるじなりけれ
と詠み給へるは、めでたき歌とて世の人口にのりて申すめるは。`,
      expect: `四条 大 納言 歌 に 、
春 来 て ぞ 人 も 訪ふ けり 山里 は 花 こそ 宿 の あるじ なり けり
と 詠む 給ふ り は 、 めでたし 歌 とて 世 の 人口 に のる て 申す めり は 。 `,
    });
  });
});
