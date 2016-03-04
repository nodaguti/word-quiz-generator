/* eslint-disable no-console */
/**
 * Lemmatizer for English using TreeTagger
 */
import TreeTagger from 'treetagger';
import path from 'path';

// This env. variable will be used by treetagger package.
process.env.TREETAGGER_HOME =
  path.join(__dirname, '..', '..', 'vendor', 'treetagger', 'cmd');

const tagger = new TreeTagger();

export default function (text) {
  return new Promise((resolve, reject) => {
    tagger.tag(text, (err, results) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
        return;
      }

      const sentence = results.map((parsed, i) => {
        // Get a context around the processing word.
        const getPart = () => {
          const prev = results[i - 1] ? results[i - 1].t : '';
          const next = results[i + 1] ? results[i + 1].t : '';

          return `${prev} ${parsed.t} ${next}`;
        };

        let shouldSpaced = true;
        let lemma;

        // Warn if an extra period is inserted
        // because it will affect the sentence separation process.
        /* istanbul ignore if */
        if (!parsed.t.includes('.') && parsed.l.includes('.')) {
          console.warn('"." is added!:', getPart());
        }

        // A word TreeTagger failed to determine the lemma is usually
        // a proper noun. But sometimes inappropriate unicode characters
        // are also reported as <unknown>, which should be removed.
        if (parsed.l === '<unknown>') {
          const isSign = /^\W+$/.test(parsed.t);

          /* istanbul ignore if */
          if (isSign) {
            console.warn(
              'Unknown sign is found!!: ',
              parsed,
              `sign: ${isSign}, part: ${getPart()}`
            );
            lemma = '';
          } else {
            lemma = parsed.t;
          }
        } else {
          switch (parsed.pos) {
            case 'CD':
              // cardinal numbers have no lemma.
              // (TreeTagger put '@CARD@' as a lemma of CD)
              lemma = parsed.t;
              break;

            case 'PP':
              // Replace personal pronouns with abstract ones.
              if (/sel(?:f|ves)$/.test(parsed.t)) {
                lemma = 'oneself';
              } else {
                lemma = 'one';
              }
              break;

            case 'PP$':
              // Replace possessive pronoun with abstract one.
              lemma = 'one\'s';
              break;

            case 'POS':
              // Always use "'s" even for plural nouns
              // to enable QuizGenerator process easily.
              lemma = '\'s';
              shouldSpaced = false;
              break;

            default:
              if (results[i + 1] && results[i + 1].pos === 'POS') {
                // Replace all possessive proper nouns with "one's".
                lemma = 'one';
              } else if (parsed.t.includes('\'')) {
                // If the input word have an apostrophe (e.g. 'm as in I'm),
                // make sure the lemma also have an apostrophe
                // and doesn't spaced between the previous word
                // so that a word count will not be differed
                // among a source and lemmatized texts.
                lemma = `'${parsed.l}`;
                shouldSpaced = false;
              } else {
                lemma = parsed.l || parsed.t;
              }
              break;
          }
        }

        return shouldSpaced ? ` ${lemma}` : lemma;
      }).join('');

      resolve(sentence.trim());
    });
  });
}
