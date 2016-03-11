/* eslint-disable no-console */
import path from 'path';
import NLP from 'stanford-corenlp';

const coreNLP = new NLP.StanfordNLP({
  nlpPath: path.join(__dirname, '../../vendor/corenlp/corenlp'),
  version: '3.5.2',
  annotators: ['tokenize', 'ssplit', 'pos', 'lemma'],
  extra: {
    'tokenize.options': [
      'normalizeParentheses=false',
      'normalizeOtherBrackets=false',
      'asciiQuotes=true',
    ].join(','),
    'ssplit.isOneSentence': 'true',
  },
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

async function lemmatize(sentence) {
  const result = await processWithCoreNLP(sentence);
  const coreNLPToken = result.document.sentences.sentence.tokens.token;
  const tokens = Array.isArray(coreNLPToken) ? coreNLPToken : [coreNLPToken];
  const lemmatized = tokens.map((token, i) => {
    let shouldSpaced = true;
    let lemma;

    switch (token.POS) {
      case 'CD':
        // cardinal numbers have no lemma.
        // (TreeTagger put '@CARD@' as a lemma of CD)
        lemma = token.word;
        break;

      case 'PRP':
        // Replace personal pronouns with abstract ones.
        if (/sel(?:f|ves)$/.test(token.word)) {
          lemma = 'oneself';
        } else {
          lemma = 'one';
        }
        break;

      case 'PRP$':
        // Replace possessive pronoun with abstract one.
        lemma = 'one\'s';
        break;

      case 'POS':
        // Always use possessive ending "'s" even for plural nouns
        // to enable QuizGenerator process easily.
        lemma = '\'s';
        break;

      case 'MD':
        // Stanford POS Tagger returns the lemma of `'ll` is `'ll`,
        // which should be `'will`.
        if (token.word === "'ll") {
          lemma = 'will';
        } else {
          lemma = token.lemma;
        }
        break;

      default:
        if (tokens[i + 1] && tokens[i + 1].POS === 'POS') {
          // Replace all possessive proper nouns with "one's".
          lemma = 'one';
        } else {
          lemma = token.lemma || token.word;
        }
    }

    // For contraction, make sure the lemma starts an apostrophe and
    // a space is not inserted before it
    // so that both word counting and word splitting will not be affected by the lemmatizing.
    // i.e. making no difference between an original and lemmatized texts.
    const isContraction = token.word.startsWith("'") || token.word === "n't";
    if (isContraction) {
      if (!lemma.startsWith("'")) {
        lemma = `'${lemma}`;
      }
      shouldSpaced = false;
    }

    // Not spaced before the beginning of a sentence.
    if (i === 0) {
      shouldSpaced = false;
    }

    return shouldSpaced ? ` ${lemma}` : lemma;
  }).join('');

  return lemmatized;
}

export default async function (text) {
  // Assume that all sentences are separated by a line break.
  const sentences = text.split('\n');
  const results = [];

  for (const sentence of sentences) {
    const lemmatized = await lemmatize(sentence);
    results.push(lemmatized);
  }

  return results.join('\n');
}
