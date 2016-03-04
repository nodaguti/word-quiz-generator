/* eslint-disable max-len */
import path from 'path';
import QuizGenerator from '../../../src/quiz-generator';
import Source from '../../../src/source';
import {
  testGetSentenceAt,
  testSelectSentence,
  testGetQuestionFromSource,
} from './_helpers';

const materialPath = path.resolve(__dirname, '../../fixtures/materials/ojp.csv');
const sourcePath = path.resolve(__dirname, '../../fixtures/sources/ojp/');

const sources = {
  'izayoi.txt': 'Izayoi Nikki (十六夜日記)',
  'complex.txt': 'a complex sentence',
};

const mapPhraseToSource = {
  かひなし: {
    'Izayoi Nikki (十六夜日記)': {
      sentenceIndex: 2,
      wordIndexes: [13],
      words: ['かひなき'],
    },
  },
  をこがまし: {
    'Izayoi Nikki (十六夜日記)': {
      sentenceIndex: 50,
      wordIndexes: [16],
      words: ['をこがましけれ'],
    },
  },
  慕ふ: {
    'Izayoi Nikki (十六夜日記)': {
      sentenceIndex: 31,
      wordIndexes: [4],
      words: ['慕は'],
    },
  },
  'つやつや 〜 ず': {
    'a complex sentence': {
      sentenceIndex: 0,
      wordIndexes: [39, 47],
      words: ['つやつや', 'ず'],
    },
  },
  'さり べし なり や あり けむ|さり べし なり や': {
    'a complex sentence': {
      sentenceIndex: 1,
      wordIndexes: [19, 20, 21, 22, 23, 24],
      words: ['さる', 'べき', 'に', 'や', 'あり', 'けむ'],
    },
  },
};

(async () => {
  const generator = new QuizGenerator({
    material: materialPath,
    sources: sourcePath,
    lang: 'ojp',
  });

  await generator.init();

  describe('QuizGenerator for Old Japanese quiz', () => {
    describe('#getSentenceAt', () => {
      const source = new Source(path.resolve(sourcePath, 'complex.txt'));
      const preprocessed = [
        '殿下 の 御 出 と も いは ず 、 一 切下 馬 の 礼儀 に も 及ば ず 、 駆け破り て 通ら ん と する 間 、 暗 さ は くらし 、 殿下 の 御 供 の 人々 、 つやつや 太政 入道 の 孫 と も 知ら ず 少々 は 又 知り たり けれ ども そら 知ら ず し て 、 資盛 朝臣 を 始 と し て 、 侍 ども 馬 より 取つ て 引き 落し 、 頗る 恥辱 に 及び けり 。',
        'こ の 男 を 尋ぬる に 、 此 御子 、 おほやけ の 使 を 召し て 、 われ 、 さる べき に や あり けむ 、 こ の 男 の 家 ゆかしく て 率 て 行け 、 と いひ しか ば 、 率 て き たり 。',
        'いみじく ここ ありよく 覺ゆ 。',
      ];
      const lemmatized = [
        '殿下 の 御 出 と も いふ ず 、 一 切下 馬 の 礼儀 に も 及ぶ ず 、 駆け破る て 通る む と す 間 、 暗し さ は くらす 、 殿下 の 御 供 の 人々 、 つやつや 太政 入道 の 孫 と も 知る ず 少々 は 又 知る たり けり ども そら 知る ず す て 、 資盛 朝臣 を 始 と す て 、 侍 ども 馬 より 取る て 引く 落す 、 頗る 恥辱 に 及ぶ けり 。',
        'こ の 男 を 尋ぬ に 、 此 御子 、 おほやけ の 使 を 召す て 、 われ 、 さり べし なり や あり けむ 、 こ の 男 の 家 ゆかし て 率る て 行く 、 と いふ き ば 、 率る て く たり 。',
        'いみじ ここ ありよし 覺ゆ 。',
      ];

      testGetSentenceAt({
        generator,
        source,
        expected: {
          preprocessed, lemmatized,
        },
      });
    });

    describe('#selectSentence', () => {
      testSelectSentence({ generator, sources, mapPhraseToSource });
    });

    describe('#getQuestionFromSource', () => {
      testGetQuestionFromSource({ generator, sources, mapPhraseToSource });
    });
  });
})();
