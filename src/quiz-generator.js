import fs from 'fs-extra-promise';
import _ from 'lodash';
import Question from './model/question.js';
import { parseSource } from './utils.js';

/**
 * Generate a quiz (a set of questions)
 * randomly selecting some phrases from a given Phrase list
 * and randomly selecting question sources from a given Source list.
 */
export default class QuizGenerator {

  /**
   * @param {Array<Phrase>} phraseList
   * @param {Array<Source>} sources
   * @param {RegExp} [sentenceSeparator]
   * @param {RegExp} [clauseRegExp]
   * @param {RegExp} [wordRegExp]
   * @param {RegExp} [wordBoundaryRegExp]
   * @param {RegExp} [abbrRegExp]
   */
  constructor({
    phraseList,
    sources,
    sentenceSeparator = /(?:[?!.]\s?)+"?(?:\s|$)(?!,)/g,
    clauseRegExp = /[^,:"?!.]+/g,
    wordRegExp = /[\w'-]+/g,
    wordBoundaryRegExp = /\b/,
    abbrRegExp = /\.\.\./g,
  }) {
    this._phraseList = phraseList;
    this._sources = sources;
    this._sentenceSeparator = sentenceSeparator;
    this._clauseRegExp = clauseRegExp;
    this._wordRegExp = wordRegExp;
    this._wordBoundaryRegExp = wordBoundaryRegExp;
    this._abbrRegExp = abbrRegExp;
  }

  /**
   * Generate a quiz.
   * @param {string} scope "-" separated string
   *                       representing a scope of the quiz.
   *                       e.g. 5-10
   * @param {number} size # of questions in the quiz.
   * @return {Array<Question>} Generated quiz.
   */
  async quiz({ scope, size }) {
    const [min = 0, max] = scope.split('-').map((num) => Number(num));
    const phrasesToTest = _.shuffle(this._phraseList.filter((phrase) => {
      return _.inRange(phrase.section, min, (max || min) + 1);
    }));
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
   * Generate a question from a given phrase.
   * @param {Phrase} phrase
   * @return {Question}
   */
  async question(phrase) {
    const sources = _.shuffle(this._sources);

    while (sources.length > 0) {
      const src = sources.pop();
      const {
        sentenceIndex,
        wordIndexes,
        reference,
      } = await this.selectSentence({
        phrase: phrase.phrase,
        src: src.lemmatized,
      });

      if (sentenceIndex !== undefined) {
        const content = await fs.readFileAsync(src.original, 'utf8');
        const { text } = parseSource(content);
        const sentence = this.getSentenceAt({ index: sentenceIndex, text });

        if (!sentence) {
          continue;
        }

        return new Question({
          phrase: phrase.phrase,
          answer: phrase.answer,
          sentence, wordIndexes, reference,
        });
      }
    }

    return null;
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

  /**
   * Generate a question from a given phrase and source.
   * @param {string} phrase The phrase to find.
   * @param {string} src Path to the source text.
   * @return {{ sentenceIndex: number, wordIndexes: Array<number>, reference: string }}
   */
  async selectSentence({ phrase, src }) {
    const content = await fs.readFileAsync(src, 'utf8');
    const { reference, text } = parseSource(content);
    const phraseRegExp = new RegExp(
      `${this._wordBoundaryRegExp.source}(` +
        phrase.replace(
          this._abbrRegExp,
          `?(?:${this._clauseRegExp.source})?`
        ) +
      `)${this._wordBoundaryRegExp.source}`,
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
      return block;
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
          .map((exp) => {
            return exp
              .replace(this._abbrRegExp, '')
              .match(this._wordRegExp) || [];
          })
      );
      const wordsRegExp = new RegExp(
        '(?:' +
          words.map((word) => word.replace(/\W/g, '\\$&')).join('|') +
        ')',
        'gi'
      );

      block.replace(wordsRegExp, (word, offset2) => {
        const inlineLeft = block.substring(0, offset2);
        const inlineIndex = (inlineLeft.match(this._wordRegExp) || []).length;
        wordIndexes.push(indexOffset + inlineIndex);
        console.log({
          sentence,
          phrase,
          left,
          indexOffset,
          block,
          word,
          inlineLeft,
          inlineIndex,
        });

        return word;
      });

      return matched;
    });

    return { reference, sentenceIndex, wordIndexes };
  }
}
