#!/bin/bash
DIR=$(cd $(dirname $0); pwd)

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

install_treetagger () {
  tput bold && echo "Preparing"  && tput sgr0
  rm -rfv ${DIR}/treetagger

  mkdir -pv ${DIR}/treetagger
  cd ${DIR}/treetagger > /dev/null

  echo ""
  tput bold && echo "Downloading install-tagger.sh" && tput sgr0
  curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/install-tagger.sh

  if [ $OS == 'Mac' ]; then
    tput bold && echo "Downloading tree-tagger-MacOSX-3.2-intel.tar.gz" && tput sgr0
    curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/tree-tagger-MacOSX-3.2-intel.tar.gz
  else
    tput bold && echo "Downloading tree-tagger-linux-3.2.tar.gz" && tput sgr0
    curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/tree-tagger-linux-3.2.tar.gz
  fi

  tput bold && echo "Downloading tagger-scripts.tar.gz" && tput sgr0
  curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/tagger-scripts.tar.gz

  tput bold && echo "Downloading english-par-linux-3.2-utf8.bin.gz" && tput sgr0
  curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/english-par-linux-3.2-utf8.bin.gz

  tput bold && echo "Downloading english-chunker-par-linux-3.2-utf8.bin.gz" && tput sgr0
  curl -# -O http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/english-chunker-par-linux-3.2-utf8.bin.gz

  echo ""
  tput bold && echo "Installing TreeTagger" && tput sgr0
  chmod +x install-tagger.sh
  sh install-tagger.sh

  tput bold && echo "Finishing" && tput sgr0
  rm -rfv install-tagger.sh tree-tagger-MacOSX-3.2-intel.tar.gz tree-tagger-linux-3.2.tar.gz tagger-scripts.tar.gz english-par-linux-3.2-utf8.bin.gz english-chunker-par-linux-3.2-utf8.bin.gz
}

install_mecab () {
  tput bold && echo "Preparing"  && tput sgr0
  rm -rfv ${DIR}/mecab

  mkdir -pv ${DIR}/mecab
  cd ${DIR}/mecab > /dev/null

  echo ""
  tput bold && echo "Downloading mecab-0.996.tar.gz" && tput sgr0
  curl -# -L "https://drive.google.com/uc?export=download&id=0B4y35FiV1wh7cENtOXlicTFaRUE" > mecab-0.996.tar.gz

  tput bold && echo "Downloading UniDic for Early Middle Japanese ver1.4" && tput sgr0
  curl -# -O "https://dl.dropboxusercontent.com/u/134600/unidic-EMJ_14.zip"

  echo ""
  tput bold && echo "Installing Mecab" && tput sgr0

  tar zxfv mecab-0.996.tar.gz
  mkdir -pv ${DIR}/mecab/mecab
  cd ${DIR}/mecab/mecab-0.996 > /dev/null
  ./configure --prefix=${DIR}/mecab/mecab --with-charset=utf8
  make
  make install

  echo ""
  tput bold && echo "Installing UniDic" && tput sgr0
  cd ${DIR}/mecab > /dev/null
  unzip unidic-EMJ_14.zip
  cp -r ${DIR}/mecab/unidic-EMJ_14/Files/dic/unidic-mecab ${DIR}/mecab/unidic-ojp
  sed -e "s|@@DICDIR@@|${DIR}/mecab/unidic-ojp|g" ${DIR}/mecab/.mecabrc > ${DIR}/mecab/unidic-ojp/.mecabrc-ojp

  echo ""
  tput bold && echo "Finishing" && tput sgr0
  cd ${DIR}/mecab > /dev/null
  rm -rf mecab-0.996.tar.gz mecab-0.996 unidic-EMJ_14.zip unidic-EMJ_14
}

for IDX in $*
do
  case ${IDX} in
    [tT]ree[tT]agger ) install_treetagger ;;
    [mM]e[cC]ab ) install_mecab ;;
    * ) echo "Package '${IDX}' is not available." ;;
  esac
done
