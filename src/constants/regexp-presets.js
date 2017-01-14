/**
 * Presets of sentenceSeparator, clauseRegExp, wordRegExp, wordBoundaryRegExp, abbrRegExp
 * for each languages.
 */

export default {
  en: {
    sentenceSeparator: /\n/g,
    clauseRegExp: /[^,:"?!.]+/g,
    wordRegExp: /[\w'\-.]+(?!\s*\.\s*$)/g,
    wordBoundaryRegExp: /\b/,
    abbrRegExp: /\.\.\./g,
  },

  ojp: {
    sentenceSeparator: /(?:。|[\n\r]+|「|」|『|』)(?:\s+)?/g,
    clauseRegExp: /[^、。「」『』]+/g,
    wordRegExp: /\S+/g,
    wordBoundaryRegExp: / /,
    abbrRegExp: /〜/g,
  },
};
