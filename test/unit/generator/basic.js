import assert from 'power-assert';
import path from 'path';
import QuizGenerator from '../../../src/quiz-generator';
import Source from '../../../src/source';

const materialPath = path.resolve(__dirname, '../../fixtures/materials/en.csv');
const sourcePath = path.resolve(__dirname, '../../fixtures/sources/en/');

(async () => {
  const generator = new QuizGenerator({
    material: materialPath,
    sources: sourcePath,
  });

  await generator.init();

  describe('QuizGenerator', () => {
    it('is properly initialized', async () => {
      assert(generator._phrases.length > 0);
      assert(generator._phrases[0].section === 1);
      assert(generator._phrases[0].phrase === 'besides');
      assert(generator._phrases[0].answer === 'on one side');
      assert(generator._sources.length > 0);
      assert(generator._sources[0] instanceof Source === true);
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

      it('returns a quiz even if the given size is larger than the # of phrases', async () => {
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
