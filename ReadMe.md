# Word Quiz Generator

🚧 _This ReadMe is currently under construction and not completed yet._

## Install
```sh
$ npm install -g word-quiz-generator
$ word-quiz-generator install TreeTagger  # deps for English word quiz
$ word-quiz-generator install MeCab # deps for Japanese word quiz
```

## Usage
```sh
$ word-quiz-generator make \
  --src=/path/to/source-texts \
  --lang=english
$ word-quiz-generator generate \
  --phrases=/path/to/phrase-list.csv \
  --sources=/path/to/source-texts \
  --scope=1-10 \
  --size=10
```

### Specs
#### Phrase List
A phrase list file should be a CSV file with the following format:

```csv
<section number>,<phrase>,<mean>
```

**&lt;section number&gt;** represents which unit does a word belong to.
(_Word quizes are usually conducted on the basis of a unit, section or something like that in a textbook, right?_)

**&lt;phrase&gt;** represents an expression to be examed. There are some special things:

- `...`: Indicating some words are to be inserted, e.g. `think ... of`.
- `|`: Indicating these different expressions should be treated as an single item, e.g. `color|colour`.

**&lt;mean&gt;** represents an answer for the phrase.

#### Source Texts

A source text file should have a _reference_ as the first line of a file and _text_ as the rest part of a file.

e.g.

```
De finibus bonorum et malorum, Marcus Tullius Cicero
Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo.
Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos,
...
```
