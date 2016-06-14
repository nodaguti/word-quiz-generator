#!/bin/bash
set -eu

DIR=$(cd $(dirname $0); pwd)
CURL_NO_PROGRESSBAR= # changed to --silent if --no-progress is specified.

if [ "$(uname)" == 'Darwin' ]; then
  OS='Mac'
elif [ "$(expr substr $(uname -s) 1 5)" == 'Linux' ]; then
  OS='Linux'
elif [ "$(expr substr $(uname -s) 1 10)" == 'MINGW32_NT' ]; then
  OS='Cygwin'
else
  echo "Your platform ($(uname -a)) is not supported." 1>&2
  exit 1
fi

if [ $OS == 'Cygwin' ]; then
  echo "Sorry, but Windows is currently not supported yet." 1>&2
  exit 1
fi

if [ $# -lt 1 ]; then
  echo "usage: install.sh <package name> [... <package name>]" 1>&2
  exit 1
fi

echo "Dir: ${DIR}"
echo "OS: ${OS} ($(uname))"
echo ""

install_corenlp () {
  tput bold && echo "Preparing"  && tput sgr0
  rm -rfv ${DIR}/corenlp

  mkdir -pv ${DIR}/corenlp
  cd ${DIR}/corenlp

  # Install npm dependencies
  npm install stanford-corenlp

  # Install 3.5.2 instead of 3.6.0 because 3.6.0 cannot be launched due to the lacks of log4j dependency
  echo ""
  tput bold && echo "Downloading Stanford CoreNLP 3.5.2" && tput sgr0
  curl -# -O $CURL_NO_PROGRESSBAR http://nlp.stanford.edu/software/stanford-corenlp-full-2015-04-20.zip

  echo ""
  tput bold && echo "Installing Stanford CoreNLP" && tput sgr0
  unzip -qq stanford-corenlp-full-2015-04-20.zip
  mv stanford-corenlp-full-2015-04-20 corenlp

  tput bold && echo "Finishing" && tput sgr0
  rm -rfv stanford-corenlp-full-2015-04-20.zip
}

install_mecab () {
  tput bold && echo "Preparing" && tput sgr0
  rm -rfv ${DIR}/mecab

  mkdir -pv ${DIR}/mecab
  cd ${DIR}/mecab

  echo ""
  tput bold && echo "Downloading MeCab 0.996" && tput sgr0
  curl -# -L $CURL_NO_PROGRESSBAR "https://drive.google.com/uc?export=download&id=0B4y35FiV1wh7cENtOXlicTFaRUE" > mecab-0.996.tar.gz

  tput bold && echo "Downloading UniDic for Early Middle Japanese ver1.4" && tput sgr0
  curl -# -O $CURL_NO_PROGRESSBAR "https://dl.dropboxusercontent.com/u/134600/unidic-EMJ_14.zip"

  echo ""
  tput bold && echo "Installing Mecab" && tput sgr0

  tar zxf mecab-0.996.tar.gz
  mkdir -pv ${DIR}/mecab/mecab
  cd ${DIR}/mecab/mecab-0.996
  ./configure --prefix=${DIR}/mecab/mecab --enable-utf8-only
  make
  make check
  make install

  echo ""
  tput bold && echo "Installing UniDic" && tput sgr0
  cd ${DIR}/mecab
  unzip unidic-EMJ_14.zip
  cp -r ${DIR}/mecab/unidic-EMJ_14/Files/dic/unidic-mecab ${DIR}/mecab/unidic-ojp
  sed -e "s|@@DICDIR@@|${DIR}/mecab/unidic-ojp|g" ${DIR}/.mecabrc > ${DIR}/mecab/unidic-ojp/.mecabrc-ojp

  echo ""
  tput bold && echo "Finishing" && tput sgr0
  cd ${DIR}/mecab
  rm -rf mecab-0.996.tar.gz mecab-0.996 unidic-EMJ_14.zip unidic-EMJ_14
}

for IDX in $*
do
  case ${IDX} in
    --no-progressbar ) CURL_NO_PROGRESSBAR="--silent --show-error" ;;
    [cC]ore[nN][lL][pP] ) install_corenlp ;;
    [mM]e[cC]ab ) install_mecab ;;
    * ) echo "Package '${IDX}' is not available." ;;
  esac
done
