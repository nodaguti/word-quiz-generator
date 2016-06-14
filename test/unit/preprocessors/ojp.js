import { assertOutput } from '../../_helpers';
import preprocessor from '../../../src/preprocessors/ojp';

const leftBrackets = {
  round: ['（', '('],
  cornered: ['［', '['],
  shell: ['〔'],
  curly: ['｛', '{'],
  lenticular: ['【'],
};

const rightBrackets = {
  round: ['）', ')'],
  cornered: ['］', ']'],
  shell: ['〕'],
  curly: ['｝', '}'],
  lenticular: ['】'],
};

describe('Old Japanese preprocessor', () => {
  it('can remove annotations', async () => {
    await Object.keys(leftBrackets).map((key) => async () => {
      const lefts = leftBrackets[key];
      const rights = rightBrackets[key];

      for (const left of lefts) {
        for (const right of rights) {
          await assertOutput({
            func: preprocessor,
            input: `あ${left}い${right}う`,
            expected: 'あう',
          });
        }
      }
    });
  });

  it('can remove nested annotations', async () => {
    await Object.keys(leftBrackets).map((key) => async () => {
      const lefts = leftBrackets[key];
      const rights = rightBrackets[key];

      for (const outerLeft of lefts) {
        for (const innerLeft of lefts) {
          for (const outerRight of rights) {
            for (const innerRight of rights) {
              await assertOutput({
                func: preprocessor,
                input: `あ${outerLeft}い${innerLeft}う${innerRight}え${outerRight}お`,
                expected: 'あお',
              });
            }
          }
        }
      }
    });
  });

  it('can remove broken nested annotations', async () => {
    await Object.keys(leftBrackets).map((key) => async () => {
      const lefts = leftBrackets[key];
      const rights = rightBrackets[key];

      for (const outerLeft of lefts) {
        for (const innerLeft of lefts) {
          for (const outerRight of rights) {
            for (const innerRight of rights) {
              // too many lefts
              await assertOutput({
                func: preprocessor,
                input: `あ${outerLeft}い${innerLeft}う${innerRight}あい`,
                expected: 'ああ い',
              });

              // too many rights
              await assertOutput({
                func: preprocessor,
                input: `あい${innerLeft}う${innerRight}あ${outerRight}い`,
                expected: 'あいあい',
              });
            }
          }
        }
      }
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

  it('can remove cornered brackets', async () => {
    await assertOutput({
      func: preprocessor,
      input: '｢あ」「た」『ま』',
      expected: 'あたま',
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
