/**
 * Presets of sentenceSeparator, clauseRegExp, wordRegExp, wordBoundaryRegExp, abbrRegExp
 * for each languages.
 */

export default {
  en: {
    sentenceSeparator: /(?:[?!.]\s?)+"?(?:\s|$)(?!,)/g,
    clauseRegExp: /[^,:"?!.]+/g,
    wordRegExp: /[\w'\-\.]+/g,
    wordBoundaryRegExp: /\b/,
    abbrRegExp: /\.\.\./g,
  },

  ojp: {
    sentenceSeparator: /(?:。|[\n\r]+|「|」|『|』)(?:\s+)?/g,
    clauseRegExp: /[^、。「」『』]+/g,
    wordRegExp: /\S+/g,
    wordBoundaryRegExp: /\s/,
    abbrRegExp: /〜/g,
  },
};
