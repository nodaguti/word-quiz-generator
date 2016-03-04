import _ from 'lodash';
import RegExpPresets from './constants/regexp-presets';
import Source from './source.js';
import {
  fetchFileList,
  parseMaterial,
} from './utils.js';

/**
 * Generate a quiz (a set of questions)
 * randomly selecting some phrases from the given material file
 * and randomly selecting question sources from the given sources.
 * NOTE: You have to run `init()` before using any other methods!
 */
export default class QuizGenerator {

  /**
   * @param {string} material Path to a CSV-formatted material file.
   * @param {string} sources Pathes to source text files or directries.
   * @param {string} [lang='en']
   *   IETF language tag in which the material written.
   *   `lang` is used for determining which RegExp preset should be used.
   *   If not specified or not found in the presets, the 'en' preset will be used.
   *   If you need to override each RegExps, please use individual parameters below.
   * @param {RegExp} [sentenceSeparator] Regular expression representing a sentence separator.
   * @param {RegExp} [clauseRegExp] Regular expression representing a clause.
   * @param {RegExp} [wordRegExp] Regular expression representing a word.
   * @param {RegExp} [wordBoundaryRegExp] Regular expression representing a word boundary.
   * @param {RegExp} [abbrRegExp] Regular expression representing an abbreviation mark.
   */
  constructor({
    material,
    sources,
    lang = 'en',
    sentenceSeparator,
    clauseRegExp,
    wordRegExp,
    wordBoundaryRegExp,
    abbrRegExp,
  }) {
    this._material = material;
    this._sources = sources;
    this._lang = lang;
    this._sentenceSeparator = sentenceSeparator;
    this._clauseRegExp = clauseRegExp;
    this._wordRegExp = wordRegExp;
    this._wordBoundaryRegExp = wordBoundaryRegExp;
    this._abbrRegExp = abbrRegExp;
  }

  /**
   * Load and parse the files of phrases and sources.
   */
  async init() {
    this._phrases = await parseMaterial(this._material);
    this._sources = await fetchFileList(this._sources, /\.txt$/);
    this._sources = this._sources.map((path) => new Source(path));
    this._loadRegExpPreset();
  }

  _loadRegExpPreset() {
    const preset = RegExpPresets[this._lang] || RegExpPresets.en;

    this._sentenceSeparator = this._sentenceSeparator || preset.sentenceSeparator;
    this._clauseRegExp = this._clauseRegExp || preset.clauseRegExp;
    this._wordRegExp = this._wordRegExp || preset.wordRegExp;
    this._wordBoundaryRegExp = this._wordBoundaryRegExp || preset.wordBoundaryRegExp;
    this._abbrRegExp = this._abbrRegExp || preset.abbrRegExp;
  }

  /**
   * Generate a quiz.
   * @param {string} sections "-" separated string
   *                          representing a scope of the quiz.
   *                          e.g. 5-10
   * @param {number} size # of questions in the quiz.
   * @return {Array<Question>} Generated quiz.
   */
  async quiz({ sections, size }) {
    const [min = 0, max] = sections.split('-').map((num) => Number(num));
    const phrasesToTest = _.shuffle(this._phrases.filter((phrase) =>
      _.inRange(phrase.section, min, (max || min) + 1)
    ));
    const quiz = [];

    while (quiz.length < size && phrasesToTest.length > 0) {
      const phrase = phrasesToTest.pop();
      const question = await this.question(phrase);

      if (question) {
        quiz.push(question);
      }
    }

    return quiz;
  }

  /**
   * Generate a question using the given phrase.
   * @param {{phrase, answer, reference}} phrase
   * @return {Question}
   */
  async question(phrase) {
    const sources = _.shuffle(this._sources);

    while (sources.length > 0) {
      const src = sources.pop();
      const question = this.getQuestionFromSource({ phrase, src });

      if (!question) {
        continue;
      }

      return question;
    }

    return null;
  }

  /**
   * Generate a question using the given phrase and source.
   * @param {{phrase, answer, reference}} phrase
   * @param {Source} src
   * @return {Question}
   */
  async getQuestionFromSource({ phrase, src }) {
    const { sentenceIndex, wordIndexes }
      = await this.selectSentence({ phrase: phrase.phrase, src });

    if (sentenceIndex !== undefined) {
      const text = await src.preprocessed.getText();
      const reference = await src.preprocessed.getReference();
      const sentence = this.getSentenceAt({ index: sentenceIndex, text });

      if (!sentence) {
        return null;
      }

      return {
        phrase: phrase.phrase,
        answer: phrase.answer,
        sentence, wordIndexes, reference,
      };
    }

    return null;
  }

  /**
   * Generate a question from a given phrase and source.
   * @param {string} phrase The phrase to find.
   * @param {string} src Path to the source text.
   * @return {{ sentenceIndex: number, wordIndexes: Array<number> }}
   */
  async selectSentence({ phrase, src }) {
    const text = await src.lemmatized.getText();
    const phraseWithAbbrRegExp = phrase.replace(
      this._abbrRegExp,
      `?(?:${this._clauseRegExp.source})?`
    );
    const wordBoundaryRegExp = this._wordBoundaryRegExp.source;
    const phraseRegExp = new RegExp(
      `${wordBoundaryRegExp}(${phraseWithAbbrRegExp})${wordBoundaryRegExp}`,
      'gi'
    );
    const matches = [];

    // Find the phrase in the source text
    // and store the match information.
    // We use 'replace' here because nether RegExp#exec nor String#match
    // have a detail of each matches like a matched block and an offset etc.
    text.replace(phraseRegExp, (matched, block, offset) => {
      const lastIndex = offset + matched.length;
      matches.push({ matched, block, offset, lastIndex });
    });

    if (!matches.length) {
      return {};
    }

    const selected = _.sample(matches);
    const leftText = text.substring(0, selected.offset);
    const leftSentences = leftText.match(this._sentenceSeparator) || [];
    const leftContext = _.last(
      leftText.split(this._sentenceSeparator)
    );
    const rightContext = _.head(
      text.substring(selected.lastIndex)
        .split(this._sentenceSeparator)
    );
    const sentence = leftContext + selected.matched + rightContext;
    const sentenceIndex = leftSentences.length;
    const wordIndexes = [];

    sentence.replace(phraseRegExp, (matched, block, offset) => {
      const left = sentence.substring(0, offset);
      const indexOffset = (left.match(this._wordRegExp) || []).length;
      const words = _.flatten(
        phrase
          .split('|')
          .map((exp) =>
            exp.replace(this._abbrRegExp, '')
              .match(this._wordRegExp) || []
          )
      );
      let wordsCount = words.length;
      const escapedWords = words.map((word) => word.replace(/\W/g, '\\$&')).join('|');
      const wordsRegExp = new RegExp(`(?:${escapedWords})`, 'gi');

      block.replace(wordsRegExp, (word, offset2) => {
        if (wordsCount <= 0) {
          return;
        }

        const inlineLeft = block.substring(0, offset2);
        const inlineIndex = (inlineLeft.match(this._wordRegExp) || []).length;

        wordIndexes.push(indexOffset + inlineIndex);
        wordsCount--;
      });
    });

    return { sentenceIndex, wordIndexes };
  }

  /**
   * Get the 'index'-th sentence of the given text.
   * @param {number} index
   * @param {string} text
   * @return {string}
   */
  getSentenceAt({ index, text }) {
    const body = text.split(this._sentenceSeparator)[index];

    if (!body) {
      return null;
    }

    const rightContext = (text.split(body)[1] || '').substring(0, 5).trim();
    if (!rightContext) {
      return body;
    }
    const endMarks = rightContext.match(this._sentenceSeparator);
    if (!endMarks) {
      return body;
    }
    const endMark = endMarks[0].trim();

    return body + endMark;
  }
}
