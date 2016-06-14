import path from 'path';
import NLP from 'stanford-corenlp';
import _ from 'lodash';

const coreNLP = new NLP.StanfordNLP({
  nlpPath: path.join(__dirname, '../../vendor/corenlp/corenlp'),
  version: '3.5.2',
  annotators: ['tokenize', 'ssplit'],
});

function processWithCoreNLP(text) {
  return new Promise((resolve, reject) => {
    coreNLP.process(text, (err, result) => {
      /* istanbul ignore if */
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

export default async function (text) {
  const emended = text
    // Remove unnecessary line breaks.
    .replace(/[\n\r]+/g, ' ')

    // Shorten repeating whitespaces.
    .replace(/ +/g, ' ')

    // Remove soft hyphens.
    .replace(/(\w)-\s+(\w)/g, '$1$2')

    // Replace some full-width signs with their half-width ones.
    .replace(/(?:‘|’)/g, '\'')
    .replace(/(?:“|”)/g, '"')
    .replace(/—/g, '--');

  const result = await processWithCoreNLP(emended);
  const sentences = [];

  // there is just one sentence and don't need to split it!
  if (!Array.isArray(result.document.sentences.sentence)) {
    return emended;
  }

  for (const sentenceData of result.document.sentences.sentence) {
    const coreNLPToken = sentenceData.tokens.token;
    const tokens = Array.isArray(coreNLPToken) ? coreNLPToken : [coreNLPToken];
    const begin = _.first(tokens).CharacterOffsetBegin;
    const end = _.last(tokens).CharacterOffsetEnd;

    sentences.push(emended.slice(begin, end));
  }

  return sentences.join('\n');
}
