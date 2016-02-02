export default class Question {
  constructor({ phrase, sentence, wordIndexes, reference, answer }) {
    this.phrase = phrase;
    this.sentence = sentence;
    this.wordIndexes = wordIndexes;
    this.reference = reference;
    this.answer = answer;
  }
}
