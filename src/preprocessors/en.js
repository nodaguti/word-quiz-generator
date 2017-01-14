import path from 'path';
import _ from 'lodash';

// Installing stanford-corenlp is not necessary if you won't use this module,
// so it is not listed in package.json.
// eslint-disable-next-line import/no-extraneous-dependencies
import NLP from 'stanford-corenlp';

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

  // there is just one sentence and don't need to split it!
  if (!Array.isArray(result.document.sentences.sentence)) {
    return emended;
  }

  const sentences = result.document.sentences.sentence.map((sentenceData) => {
    const coreNLPToken = sentenceData.tokens.token;
    const tokens = Array.isArray(coreNLPToken) ? coreNLPToken : [coreNLPToken];
    const begin = _.first(tokens).CharacterOffsetBegin;
    const end = _.last(tokens).CharacterOffsetEnd;

    return emended.slice(begin, end);
  });

  return sentences.join('\n');
}
