import fs from 'fs-extra-promise';

export default class Source {

  /**
   * @param {string} path Path to a source file.
   * @param {boolean} shouldEnsureFile Whether or not create a file if not exists.
   */
  constructor(path, shouldEnsureFile) {
    if (shouldEnsureFile) {
      fs.ensureFileSync(path);
    } else {
      fs.statSync(path);
    }

    this.path = path;
  }

  get preprocessed() {
    if (this._preprocessed) {
      return this._preprocessed;
    }

    try {
      return (this._preprocessed = new Source(`${this.path}.preprocessed`));
    } catch (err) {
      return (this._preprocessed = this);
    }
  }

  get lemmatized() {
    if (this._lemmatized) {
      return this._lemmatized;
    }

    try {
      return (this._lemmatized = new Source(`${this.path}.lemmatized`));
    } catch (err) {
      return (this._lemmatized = this);
    }
  }

  /**
   * Read the content of the file, parse it, and populate the results.
   */
  async _fetchContent() {
    const content = await fs.readFileAsync(this.path, 'utf-8');
    const [reference, ...text] = content.split(/[\n\r]/);

    this.setReference(reference);
    this.setText(text.join('\n'));
  }

  /**
   * Return the reference information of this source.
   * @return {string}
   */
  async getReference() {
    if (this._reference) {
      return this._reference;
    }

    await this._fetchContent();
    return this._reference;
  }

  /**
   * Set the reference information of this source.
   * @param {string} reference
   */
  setReference(reference) {
    this._reference = reference;
  }

  /**
   * Return the body text of this source.
   * @return {string}
   */
  async getText() {
    if (this._text) {
      return this._text;
    }

    await this._fetchContent();
    return this._text;
  }

  /**
   * Set the body text of this source.
   * @param {string} text
   */
  setText(text) {
    this._text = text;
  }

  /**
   * Write the reference and the body text to the file.
   */
  async save() {
    const reference = await this.getReference();
    const text = await this.getText();
    await fs.writeFileAsync(this.path, `${reference}\n${text}`);
  }

  /**
   * Preprocess the text using the given preprocessor and save the result.
   * @param {Function<Promise<string>>} preprocessor
   */
  async preprocess(preprocessor) {
    const source = new Source(`${this.path}.preprocessed`, true);
    const reference = await this.getReference();
    const text = await this.getText();
    const preprocessed = await preprocessor(text);

    source.setReference(reference);
    source.setText(preprocessed);
    await source.save();
  }

  /**
   * Lemmatize the preprocessed text using the given lemmatizer
   * and save the result.
   * @param {Function<Promise<string>>} lemmatizer
   */
  async lemmatize(lemmatizer) {
    const source = new Source(`${this.path}.lemmatized`, true);
    const reference = await this.preprocessed.getReference();
    const text = await this.preprocessed.getText();
    const lemmatized = await lemmatizer(text);

    source.setReference(reference);
    source.setText(lemmatized);
    await source.save();
  }
}
