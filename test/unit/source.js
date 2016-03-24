import assert from 'power-assert';
import path from 'path';
import fs from 'fs-extra-promise';
import Source from '../../src/source.js';
import preprocessor from '../../src/preprocessors/en.js';
import lemmatizer from '../../src/lemmatizers/en.js';

const existedPath = path.resolve(__dirname, '../fixtures/sources/dummy/test.txt');
const notExistedPath = path.resolve(__dirname, '../fixtures/sources/dummy/not-existed.dummy');

describe('Source', () => {
  describe('#constructor()', () => {
    it('should create an instance', () => {
      const src = new Source(existedPath);
      assert(src.path === existedPath);
    });

    it('should throw if a given path is not existed', () => {
      try {
        // eslint-disable-next-line no-new
        new Source(notExistedPath);
      } catch (err) {
        assert(err !== undefined);
      }
    });

    it('should create a empty file when shouldEnsureFile is true', async () => {
      let err;

      try {
        const src = new Source(notExistedPath, true);
        const stat = await fs.statAsync(notExistedPath);
        assert(stat !== undefined);
        assert(src.path === notExistedPath);
      } catch (e) {
        err = e;
      } finally {
        assert(err === undefined);
      }
    });
  });

  describe('#preprocessed', () => {
    it('should return an original path if not existed', async () => {
      const src = new Source(existedPath);
      await fs.removeAsync(`${existedPath}.preprocessed`);
      const preprocessed = src.preprocessed;
      assert(preprocessed !== undefined);
      assert(preprocessed.path === existedPath);
    });

    it('should return an path ending `.preprocessed` if it exists', async () => {
      const preprocessedPath = `${existedPath}.preprocessed`;
      const src = new Source(existedPath);
      await fs.ensureFileAsync(preprocessedPath);
      const preprocessed = src.preprocessed;
      assert(preprocessed !== undefined);
      assert(preprocessed.path === preprocessedPath);
    });
  });

  describe('#lemmatized', () => {
    it('should return the original path if not existed', async () => {
      const src = new Source(existedPath);
      await fs.removeAsync(`${existedPath}.lemmatized`);
      const lemmatized = src.lemmatized;
      assert(lemmatized !== undefined);
      assert(lemmatized.path === existedPath);
    });

    it('should return an path ending `.lemmatized` if it exists', async () => {
      const lemmatizedPath = `${existedPath}.lemmatized`;
      const src = new Source(existedPath);
      await fs.ensureFileAsync(lemmatizedPath);
      const lemmatized = src.lemmatized;
      assert(lemmatized !== undefined);
      assert(lemmatized.path === lemmatizedPath);
    });
  });

  describe('#preprocess', () => {
    it('should create a preprocessed text', async () => {
      const src = new Source(existedPath);
      const ref = await src.getReference();
      await fs.removeAsync(`${existedPath}.preprocessed`);
      await src.preprocess(preprocessor);
      const preprocessed = src.preprocessed;
      const preprocessedRef = await preprocessed.getReference();
      const preprocessedText = await preprocessed.getText();

      assert(preprocessed !== undefined);
      assert(preprocessed.path === `${existedPath}.preprocessed`);
      assert(preprocessedRef === ref);
      assert(preprocessedText !== undefined);
    });
  });

  describe('#lemmatize', () => {
    it('should create a lemmatized text', async () => {
      const src = new Source(existedPath);
      const ref = await src.getReference();
      await fs.removeAsync(`${existedPath}.lemmatized`);
      await src.lemmatize(lemmatizer);
      const lemmatized = src.lemmatized;
      const lemmatizedRef = await lemmatized.getReference();
      const lemmatizedText = await lemmatized.getText();

      assert(lemmatized !== undefined);
      assert(lemmatized.path === `${existedPath}.lemmatized`);
      assert(lemmatizedRef === ref);
      assert(lemmatizedText !== undefined);
    });
  });
});
