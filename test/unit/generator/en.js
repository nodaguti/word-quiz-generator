/* eslint-disable max-len */
import path from 'path';
import QuizGenerator from '../../../src/quiz-generator';
import Source from '../../../src/source';
import {
  testGetSentenceAt,
  testSelectSentence,
  testGetQuestionFromSource,
} from './_helpers';

const sources = {
  'simple.txt': 'a simple sentence',
  'possessive.txt': 'a sentence containing possesive words',
  'omitted.txt': 'a sentence containing omission of letters',
  'complex.txt': 'a complex sentence',
};

const mapPhraseToSource = {
  besides: {
    'a simple sentence': {
      sentenceIndex: 0,
      wordIndexes: [0],
      words: ['Besides'],
    },
    'a sentence containing possesive words': {
      sentenceIndex: 0,
      wordIndexes: [4],
      words: ['besides'],
    },
    'a sentence containing omission of letters': {
      sentenceIndex: 0,
      wordIndexes: [8],
      words: ['besides'],
    },
    'a complex sentence': {
      sentenceIndex: 0,
      wordIndexes: [8],
      words: ['besides'],
    },
  },
  'regardless of': {
    'a simple sentence': {
      sentenceIndex: 1,
      wordIndexes: [6, 7, 20, 21],
      words: ['regardless', 'of', 'regardless', 'of'],
    },
    'a sentence containing possesive words': {
      sentenceIndex: 1,
      wordIndexes: [22, 23],
      words: ['regardless', 'of'],
    },
    'a sentence containing omission of letters': {
      sentenceIndex: 1,
      wordIndexes: [6, 7],
      words: ['regardless', 'of'],
    },
    'a complex sentence': {
      sentenceIndex: 1,
      wordIndexes: [27, 28],
      words: ['regardless', 'of'],
    },
  },
  'talk ... into': {
    'a simple sentence': {
      sentenceIndex: 2,
      wordIndexes: [8, 10],
      words: ['talk', 'into'],
    },
    'a sentence containing possesive words': {
      sentenceIndex: 2,
      wordIndexes: [22, 25],
      words: ['talk', 'into'],
    },
    'a sentence containing omission of letters': {
      sentenceIndex: 2,
      wordIndexes: [2, 4],
      words: ['talked', 'into'],
    },
    'a complex sentence': {
      sentenceIndex: 2,
      wordIndexes: [7, 9],
      words: ['talk', 'into'],
    },
  },
  "one's name": {
    'a simple sentence': {
      sentenceIndex: 3,
      wordIndexes: [26, 27],
      words: ['their', 'name'],
    },
    'a sentence containing possesive words': {
      sentenceIndex: 3,
      wordIndexes: [4, 5],
      words: ['his', 'name'],
    },
    'a sentence containing omission of letters': {
      sentenceIndex: 3,
      wordIndexes: [6, 7],
      words: ['their', 'name'],
    },
    'a complex sentence': {
      sentenceIndex: 3,
      wordIndexes: [13, 14, 19, 20],
      words: ["father's", 'name', "grandfather's", 'name'],
    },
  },
  "one'be nice": {
    'a simple sentence': {
      sentenceIndex: 4,
      wordIndexes: [1, 2],
      words: ["it's", 'nice'],
    },
    'a sentence containing possesive words': {
      sentenceIndex: 4,
      wordIndexes: [17, 18],
      words: ["it's", 'nice'],
    },
    'a complex sentence': {
      sentenceIndex: 4,
      wordIndexes: [19, 20],
      words: ["It's", 'nice'],
    },
  },
};

const materialPath = path.resolve(__dirname, '../../fixtures/materials/en.csv');
const sourcePath = path.resolve(__dirname, '../../fixtures/sources/en/');

(async () => {
  const generator = new QuizGenerator({
    material: materialPath,
    sources: sourcePath,
  });

  await generator.init();

  describe('QuizGenerator for English quiz', () => {
    describe('#getSentenceAt', () => {
      const source = new Source(path.resolve(sourcePath, 'complex.txt'));
      const preprocessed = [
        '"I think," he said, "he doesn\'t trust anyone besides himself."',
        'On 26 April 1915, Smith, on his own initiative, recovered wounded soldiers while exposed to sustained fire and attended to them "with the greatest devotion to duty regardless of personal risk" (Issy Smith, Wikipedia).',
        'It was not hard for him to "talk me into changing my mind" (Nando Parrado, Wikipedia).',
        'The full name is written as: First name (given name) followed by the father\'s name, and last by the grandfather\'s name (Patronymic, Wikipedia).',
        '(Eh, Wikipedia) It is also commonly used as a question tag, i.e., method for inciting a reply, as in "It\'s nice here, eh?"',
      ];
      const lemmatized = [
        '" one think , " one say , " one do\'n\'t trust anyone besides oneself . "',
        'on 26 April 1915 , Smith , on one\'s own initiative , recover wounded soldier while expose to sustained fire and attend to one " with the great devotion to duty regardless of personal risk " ( Issy Smith , Wikipedia) .',
        'one be not hard for one to " talk one into change one\'s mind " ( Nando Parrado , Wikipedia) .',
        'the full name be write as : first name ( give name ) follow by the one\'s name , and last by the one\'s name ( Patronymic , Wikipedia) .',
        '( Eh , Wikipedia ) one be also commonly use as a question tag , i.e. , method for incite a reply , as in " one\'be nice here , eh ? "',
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
