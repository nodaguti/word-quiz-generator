import debug from 'debug';
import _ from 'lodash';
import RegExpPresets from './constants/regexp-presets';
import wordDivider from './constants/word-divider';
import Source from './source';
import {
  fetchFileList,
  parseMaterial,
} from './utils';

const log = debug('word-quiz-generator');

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
   * @param {number} size # of questions in a quiz to generate.
   * @return {Array<Question>} Generated quiz.
   */
  async quiz({ sections, size }) {
    const [min = 0, max] = sections.split('-').map((num) => Number(num));
    const phrasesToTest = _.shuffle(this._phrases.filter((phrase) =>
      _.inRange(phrase.section, min, (max || min) + 1),
    ));
    const quiz = [];

    const chunks = _.chunk(phrasesToTest, size);

    await new Promise((resolve) => {
      chunks.reduce((promise, chunk) =>
        promise.then(() => {
          if (quiz.length >= size) {
            return Promise.resolve();
          }

          return Promise.all(chunk.map((phrase) => (async () => {
            const question = await this.question(phrase);

            if (question) {
              quiz.push(question);
            }

            if (quiz.length >= size) {
              resolve();
            }
          })()));
        }),
        Promise.resolve(),
      ).then(() => resolve());
    });

    return _.take(quiz, size);
  }

  /**
   * Generate a question using the given phrase.
   * @param {{phrase, answer, reference}} phrase
   * @return {Question|null}
   */
  async question(phrase) {
    const sources = _.shuffle(this._sources);

    return new Promise((resolve) => {
      Promise.all(sources.map((src) => (async () => {
        const question = await this.generateQuestionFromSource({ phrase, src });

        if (question) {
          resolve(question);
        }
      })())).then(() => resolve(null));
    });
  }

  /**
   * Generate a question using the given phrase and source.
   * @param {{phrase, answer, reference}} phrase
   * @param {Source} src
   * @return {Question|null}
   */
  async generateQuestionFromSource({ phrase, src }) {
    const result = await this.selectSentence({ phrase: phrase.phrase, src });

    if (!result) {
      return null;
    }

    const { sentenceIndex, wordIndexes } = result;
    const text = await src.preprocessed.getText();
    const reference = await src.preprocessed.getReference();
    const sentence = this.getSentenceAt({ index: sentenceIndex, text });

    /* istanbul ignore if */
    if (!sentence) {
      return null;
    }

    const body = this.parseQuestionSentence({ sentence, wordIndexes });

    return {
      body,
      answer: phrase.answer,
      reference,
      phrase: phrase.phrase,
    };
  }

  /**
   * @param {string} original (non-lemmatized) sentence
   * @param {Array<number>} wordIndexes index numbers representing which word is a part of question.
   * @return {Array<{ text: string, isQuestionPart: bool, isMark: bool, isDivider: bool }>}
   */
  parseQuestionSentence({ sentence, wordIndexes }) {
    // Here we assume word divider is space.
    // If you are dealing with a language it is not the case (e.g. Japanese),
    // firstly you have to convert a text using a preprocessor.
    const tokenRegExp = new RegExp(`(${this._wordRegExp.source})(\\s*)`, 'g');
    const tokens = [];
    const divider = _.findKey(wordDivider, (regs) => regs.some((reg) => reg.test(this._lang)));
    let currentWordIndex = 0;
    let prevLastIndex = 0;
    let matched;

    // eslint-disable-next-line no-cond-assign
    while ((matched = tokenRegExp.exec(sentence))) {
      const [, token, hasDivider] = matched;
      const punctuation = sentence.substring(prevLastIndex, matched.index);
      const isQuestionWord = wordIndexes[0] === currentWordIndex;
      const isSuccessive =
        isQuestionWord &&
        (wordIndexes[0] + 1) === wordIndexes[1];

      if (punctuation) {
        tokens.push({
          text: punctuation,
          isMark: true,
        });
      }

      tokens.push({
        text: token,
        isQuestionPart: isQuestionWord,
      });

      if (hasDivider && divider) {
        tokens.push({
          text: divider,
          isQuestionPart: isSuccessive,
          isMark: true,
          isDivider: true,
        });
      }

      if (isQuestionWord) {
        wordIndexes.shift();
      }

      currentWordIndex += 1;
      prevLastIndex = tokenRegExp.lastIndex;
    }

    const stopPunctuation = sentence.substring(prevLastIndex);
    tokens.push({
      text: stopPunctuation,
      isMark: true,
    });

    log({ tokens });

    return tokens;
  }

  /**
   * Generate a question from a given phrase and source.
   * @param {string} phrase phrase to find.
   * @param {Source} src
   * @return {{ sentenceIndex: number, wordIndexes: Array<number> }}
   */
  async selectSentence({ phrase, src }) {
    const result = await this.findSentenceIncludingPhrase({ phrase, src });

    if (!result) {
      return null;
    }

    const {
      lemmatizedSentence,
      index: sentenceIndex,
    } = result;
    const wordIndexes = this.findWordIndexesWithinLemmatizedSentence({
      lemmatizedSentence,
      phrase,
    });

    log({
      phrase,
      src: _.last(src.path.split('/')),
      sentenceIndex,
      lemmatizedSentence,
      wordIndexes,
    });

    return { sentenceIndex, wordIndexes };
  }

  findWordIndexesWithinLemmatizedSentence({ lemmatizedSentence, phrase }) {
    const sentence = lemmatizedSentence;
    const phraseRegExp = this.getPhraseRegExp(phrase);
    const wordIndexes = [];

    sentence.replace(phraseRegExp, (matched, block, offset) => {
      const left = sentence.substring(0, offset);
      const indexOffset = (left.match(this._wordRegExp) || []).length;
      const words = _.flatten(
        phrase
          .split('|')
          .map((exp) =>
            exp.replace(this._abbrRegExp, '')
              .match(this._wordRegExp) || [],
        ),
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
        wordsCount -= 1;
      });
    });

    return wordIndexes;
  }

  async findSentenceIncludingPhrase({ src, phrase }) {
    const text = await src.lemmatized.getText();
    const phraseRegExp = this.getPhraseRegExp(phrase);
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
      return null;
    }

    log({
      phraseRegExp,
      src: _.last(src.path.split('/')),
      matches,
    });

    const selected = _.sample(matches);
    const leftText = text.substring(0, selected.offset);
    const leftSentences = leftText.match(this._sentenceSeparator) || [];
    const leftContext = _.last(
      leftText.split(this._sentenceSeparator),
    );
    const rightContext = _.head(
      text.substring(selected.lastIndex)
        .split(this._sentenceSeparator),
    );
    const lemmatizedSentence = leftContext + selected.matched + rightContext;
    const index = leftSentences.length;

    return { lemmatizedSentence, index };
  }

  getPhraseRegExp(phrase) {
    const phraseWithAbbrRegExp = phrase.replace(
      this._abbrRegExp,
      `?(?:${this._clauseRegExp.source})?`,
    );
    const wordBoundaryRegExp = this._wordBoundaryRegExp.source;
    const phraseRegExp = new RegExp(
      `(?:^|${wordBoundaryRegExp})(${phraseWithAbbrRegExp})${wordBoundaryRegExp}`,
      'gim',
    );

    return phraseRegExp;
  }

  /**
   * Get the 'index'-th sentence of the given text.
   * @param {number} index
   * @param {string} text
   * @return {string}
   */
  getSentenceAt({ index, text }) {
    const body = text.split(this._sentenceSeparator)[index];

    /* istanbul ignore if */
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
