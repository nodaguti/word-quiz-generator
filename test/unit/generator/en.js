/* eslint-disable max-len */
import assert from 'power-assert';
import path from 'path';
import { exec } from 'child_process';
import _ from 'lodash';
import QuizGenerator from '../../../src/quiz-generator';
import Source from '../../../src/source';

const sources = {
  'simple.txt': 'simple sentence',
  'possessive.txt': 'sentence containing possesive words',
  'omitted.txt': 'sentence containing omission of letters',
  'complex.txt': 'complex sentence',
};

const mapPhraseToSource = {
  besides: {
    'simple sentence': {
      sentenceIndex: 0,
      wordIndexes: [0],
      words: ['Besides'],
    },
    'sentence containing possesive words': {
      sentenceIndex: 0,
      wordIndexes: [4],
      words: ['besides'],
    },
    'sentence containing omission of letters': {
      sentenceIndex: 0,
      wordIndexes: [8],
      words: ['besides'],
    },
    'complex sentence': {
      sentenceIndex: 0,
      wordIndexes: [8],
      words: ['besides'],
    },
  },
  'regardless of': {
    'simple sentence': {
      sentenceIndex: 1,
      wordIndexes: [6, 7, 20, 21],
      words: ['regardless', 'of', 'regardless', 'of'],
    },
    'sentence containing possesive words': {
      sentenceIndex: 1,
      wordIndexes: [22, 23],
      words: ['regardless', 'of'],
    },
    'sentence containing omission of letters': {
      sentenceIndex: 1,
      wordIndexes: [6, 7],
      words: ['regardless', 'of'],
    },
    'complex sentence': {
      sentenceIndex: 1,
      wordIndexes: [27, 28],
      words: ['regardless', 'of'],
    },
  },
  'talk ... into': {
    'simple sentence': {
      sentenceIndex: 2,
      wordIndexes: [8, 10],
      words: ['talk', 'into'],
    },
    'sentence containing possesive words': {
      sentenceIndex: 2,
      wordIndexes: [22, 25],
      words: ['talk', 'into'],
    },
    'sentence containing omission of letters': {
      sentenceIndex: 2,
      wordIndexes: [2, 4],
      words: ['talked', 'into'],
    },
    'complex sentence': {
      sentenceIndex: 2,
      wordIndexes: [7, 9],
      words: ['talk', 'into'],
    },
  },
  "one's name": {
    'simple sentence': {
      sentenceIndex: 3,
      wordIndexes: [26, 27],
      words: ['their', 'name'],
    },
    'sentence containing possesive words': {
      sentenceIndex: 3,
      wordIndexes: [4, 5],
      words: ['his', 'name'],
    },
    'sentence containing omission of letters': {
      sentenceIndex: 3,
      wordIndexes: [6, 7],
      words: ['their', 'name'],
    },
    'complex sentence': {
      sentenceIndex: 3,
      wordIndexes: [13, 14, 19, 20],
      words: ["father's", 'name', "grandfather's", 'name'],
    },
  },
  "one'be nice": {
    'simple sentence': {
      sentenceIndex: 4,
      wordIndexes: [1, 2],
      words: ["it's", 'nice'],
    },
    'sentence containing possesive words': {
      sentenceIndex: 4,
      wordIndexes: [17, 18],
      words: ["it's", 'nice'],
    },
    'complex sentence': {
      sentenceIndex: 4,
      wordIndexes: [19, 20],
      words: ["It's", 'nice'],
    },
  },
};

const materialPath = path.resolve(__dirname, '../../fixtures/materials/en.csv');
const sourcePath = path.resolve(__dirname, '../../fixtures/sources/en/');
const generator = new QuizGenerator({
  material: materialPath,
  sources: sourcePath,
});

before((done) => {
  const cli = path.resolve(__dirname, '../../../lib/cli.js');
  exec(`node ${cli} make --src=${sourcePath} --lang=en`, done);
});

(async () => {
  await generator.init();

  describe('[English Quiz] QuizGenerator', () => {
    it('is properly initialized', async () => {
      assert(generator._phrases.length > 0);
      assert(generator._phrases[0].section === 1);
      assert(generator._phrases[0].phrase === 'besides');
      assert(generator._phrases[0].answer === 'on one side');
      assert(generator._sources.length > 0);
      assert(generator._sources[0] instanceof Source === true);
    });

    describe('#getSentenceAt', () => {
      const source = new Source(path.resolve(sourcePath, 'complex.txt'));
      const originalSentences = [
        '"I think," he said, "he doesn\'t trust anyone besides himself."',
        'On 26 April 1915, Smith, on his own initiative, recovered wounded soldiers while exposed to sustained fire and attended to them "with the greatest devotion to duty regardless of personal risk" (Issy Smith, Wikipedia).',
        'It was not hard for him to "talk me into changing my mind" (Nando Parrado, Wikipedia).',
        'The full name is written as: First name (given name) followed by the father\'s name, and last by the grandfather\'s name (Patronymic, Wikipedia).',
        '(Eh, Wikipedia) It is also commonly used as a question tag, i.e., method for inciting a reply, as in "It\'s nice here, eh?"',
      ];
      const lemmatizedSentences = [
        '" one think , " one say , " one do\'n\'t trust anyone besides oneself . "',
        'on 26 April 1915 , Smith , on one\'s own initiative , recover wounded soldier while expose to sustained fire and attend to one " with the great devotion to duty regardless of personal risk " ( Issy Smith , Wikipedia) .',
        'one be not hard for one to " talk one into change one\'s mind " ( Nando Parrado , Wikipedia) .',
        'the full name be write as : first name ( give name ) follow by the one\'s name , and last by the one\'s name ( Patronymic , Wikipedia) .',
        '( Eh , Wikipedia ) one be also commonly use as a question tag , i.e. , method for incite a reply , as in " one\'be nice here , eh ? "',
      ];

      it('can extract the sentence at the designated index from the original texts', async () => {
        const original = await source.getText();
        originalSentences.forEach((expected, index) => {
          const output = generator.getSentenceAt({ index, text: original });
          assert(output === expected);
        });
      });

      it('can extract the sentence at the designated index from the lemmatized texts', async () => {
        const lemmatized = await source.lemmatized.getText();
        lemmatizedSentences.forEach((expected, index) => {
          const output = generator.getSentenceAt({ index, text: lemmatized });
          assert(output === expected);
        });
      });
    });

    describe('#selectSentence', () => {
      generator._phrases.forEach((phraseObj) => {
        const phrase = phraseObj.phrase;

        describe(`can find and locate '${phrase}'`, () => {
          Object.keys(sources).forEach((key) => {
            const filename = key;
            const sourceDesc = sources[key];
            const expected = mapPhraseToSource[phrase][sourceDesc];

            if (!expected) {
              return;
            }

            it(`in a ${sourceDesc}`, async () => {
              const src = generator._sources.find((source) => source.path.endsWith(filename));
              const question = await generator.selectSentence({ phrase, src });

              assert(question.sentenceIndex === expected.sentenceIndex);
              assert(_.difference(question.wordIndexes, expected.wordIndexes).length === 0);
            });
          });
        });
      });
    });

    describe('#getQuestionFromSource', () => {
      generator._phrases.forEach((phraseObj) => {
        const phrase = phraseObj.phrase;

        describe(`can generate a question using '${phrase}'`, () => {
          Object.keys(sources).forEach((key) => {
            const filename = key;
            const sourceDesc = sources[key];
            const expected = mapPhraseToSource[phrase][sourceDesc];

            if (!expected) {
              return;
            }

            it(`from ${filename}`, async () => {
              const src = generator._sources.find((source) => source.path.endsWith(filename));
              const question = await generator.getQuestionFromSource({ phrase: phraseObj, src });
              const words = question.sentence.match(generator._wordRegExp);

              assert(question.phrase === phraseObj.phrase);
              assert(question.answer === phraseObj.answer);
              assert(question.reference === filename);

              question.wordIndexes.forEach((wordIndex, i) => {
                assert(words[wordIndex] === expected.words[i]);
              });
            });
          });
        });
      });
    });

    describe('#question', () => {
      it('returns a well-formed question', async () => {
        const phraseObj = generator._phrases[0];
        const question = await generator.question(phraseObj);

        assert(question.phrase === phraseObj.phrase);
        assert(question.answer === phraseObj.answer);
      });

      it('returns null if no sentences contain the given phrase', async () => {
        const phraseObj = {
          phrase: 'hogefuga',
          answer: 'beeboo',
          reference: 'foobar',
        };
        const question = await generator.question(phraseObj);

        assert(question === null);
      });
    });

    describe('#quiz', () => {
      it('returns a quiz of the designated size', async () => {
        const quiz = await generator.quiz({ sections: '1', size: 1 });

        assert(quiz.length === 1);
        quiz.forEach((question) => {
          assert(question.phrase === generator._phrases[0].phrase);
        });
      });

      it('returns a quiz even if the given size is larger than the # of phrases in the sections', async () => {
        const quiz = await generator.quiz({ sections: '1', size: 3 });

        assert(quiz.length === 1);
        quiz.forEach((question) => {
          assert(question.phrase === generator._phrases[0].phrase);
        });
      });

      it('returns a quiz even if the given size is larger than the # of sources', async () => {
        const quiz = await generator.quiz({ sections: '1', size: 10 });

        assert(quiz.length === 1);
        quiz.forEach((question) => {
          assert(question.phrase === generator._phrases[0].phrase);
        });
      });
    });
  });
})();
