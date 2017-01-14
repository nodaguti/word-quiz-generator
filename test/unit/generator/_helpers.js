/* eslint-disable no-console */
import assert from 'assert';
import _ from 'lodash';

export function testGetSentenceAt({
  generator,
  source,
  expected: { preprocessed, lemmatized },
}) {
  it('can extract the sentence at the designated index from the preprocessed texts', async () => {
    const text = await source.preprocessed.getText();

    preprocessed.forEach((expected, index) => {
      const output = generator.getSentenceAt({ index, text });
      assert(output === expected);
    });
  });

  it('can extract the sentence at the designated index from the lemmatized texts', async () => {
    const text = await source.lemmatized.getText();

    lemmatized.forEach((expected, index) => {
      const output = generator.getSentenceAt({ index, text });
      assert(output === expected);
    });
  });
}

export function testSelectSentence({
  generator,
  sources,
  mapPhraseToSource,
}) {
  try {
    generator._phrases.forEach((phraseObj) => {
      const phrase = phraseObj.phrase;
      const desc = phraseObj._[0];

      describe(`can find and locate '${phrase}' (${desc})`, () => {
        Object.keys(sources).forEach((key) => {
          const filename = key;
          const sourceDesc = sources[key];
          const expected = mapPhraseToSource[phrase][sourceDesc];

          if (!expected) {
            return;
          }

          it(`in ${sourceDesc}`, async () => {
            const src = generator._sources.find((source) => source.path.endsWith(filename));
            const question = await generator.selectSentence({ phrase, src });

            assert(question.sentenceIndex === expected.sentenceIndex);
            assert(_.xor(question.wordIndexes, expected.wordIndexes).length === 0);
          });
        });
      });
    });
  } catch (err) {
    console.error(err.stack);
  }
}

export function testGenerateQuestionFromSource({
  generator,
  sources,
  mapPhraseToSource,
}) {
  try {
    generator._phrases.forEach((phraseObj) => {
      const phrase = phraseObj.phrase;
      const desc = phraseObj._[0];

      describe(`can generate a question using '${phrase}' (${desc})`, () => {
        Object.keys(sources).forEach((key) => {
          const filename = key;
          const sourceDesc = sources[key];
          const expected = mapPhraseToSource[phrase][sourceDesc];

          if (!expected) {
            return;
          }

          it(`from ${filename}`, async () => {
            const src = generator._sources.find((source) => source.path.endsWith(filename));
            const question = await generator.generateQuestionFromSource({ phrase: phraseObj, src });

            assert(question.phrase === phraseObj.phrase);
            assert(question.answer === phraseObj.answer);

            const tokens = question.body
              .filter(({ isQuestionPart, isMark }) =>
                isQuestionPart && !isMark,
              )
              .map(({ text }) => text);

            assert(tokens.length === expected.words.length);
            tokens.forEach((token, index) =>
              // show `tokens` in a power-assert error message
              assert(tokens && token === expected.words[index]),
            );
          });
        });
      });
    });
  } catch (err) {
    console.error(err.stack);
  }
}
