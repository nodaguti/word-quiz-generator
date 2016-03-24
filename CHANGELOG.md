## 3.0.0
### Breaking Changes
- Non-space [word divider](https://en.wikipedia.org/wiki/Word_divider) is now properly treated.
  - A generated quiz no longer contains extra spaces for Japanese.

## 2.0.0
### Breaking Changes
- Changed English parser from TreeTagger to Stanford CoreNLP.
  - You have to install Stanford CoreNLP with `word-quiz-generator install coreNLP` to deal with English materials/sources.
- `QuizGenerator#quiz` and `#question` now returns tokenized question sentence.
See [this commit](https://github.com/nodaguti/word-quiz-generator/commit/8b27ca16d7de381f1f133d1ba3b90f05f2126436#diff-7bae57ea4d8d2c12381f85ff579778f6) to know details.

## 1.0.0
- Initial release.
