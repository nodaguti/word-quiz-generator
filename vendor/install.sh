#!/bin/sh
DIR=$(cd $(dirname $0); pwd)

if [ "$(uname)" == 'Darwin' ]; then
  OS='Mac'
elif [ "$(expr substr $(uname -s) 1 5)" == 'Linux' ]; then
  OS='Linux'
elif [ "$(expr substr $(uname -s) 1 10)" == 'MINGW32_NT' ]; then
  OS='Cygwin'
else
  echo "Your platform ($(uname -a)) is not supported."
  exit 1
fi

if [ $OS == 'Cygwin' ]; then
  echo "Sorry, but Windows is currently not supported yet."
  exit 1
fi

echo "Dir: ${DIR}"
echo "OS: ${OS} ($(uname))"

echo ""
tput bold && echo "Cleanup"  && tput sgr0
rm -rfv ${DIR}/treetagger ${DIR}/mecab

echo ""
echo "###############"
echo "# Tree Tagger"
echo "###############"
echo ""

mkdir -p ${DIR}/treetagger
cd ${DIR}/treetagger > /dev/null

tput bold && echo "Download install-tagger.sh" && tput sgr0
curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/install-tagger.sh

if [ $OS == 'Mac' ]; then
  tput bold && echo "Download tree-tagger-MacOSX-3.2-intel.tar.gz" && tput sgr0
  curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/tree-tagger-MacOSX-3.2-intel.tar.gz
else
  tput bold && echo "Download tree-tagger-linux-3.2.tar.gz" && tput sgr0
  curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/tree-tagger-linux-3.2.tar.gz
fi

tput bold && echo "Download tagger-scripts.tar.gz" && tput sgr0
curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/tagger-scripts.tar.gz

tput bold && echo "Download english-par-linux-3.2-utf8.bin.gz" && tput sgr0
curl -# -O  http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/english-par-linux-3.2-utf8.bin.gz

tput bold && echo "Download english-chunker-par-linux-3.2-utf8.bin.gz" && tput sgr0
curl -# -O http://www.cis.uni-muenchen.de/~schmid/tools/TreeTagger/data/english-chunker-par-linux-3.2-utf8.bin.gz

echo ""
tput bold && echo "Install TreeTagger" && tput sgr0
chmod +x install-tagger.sh
sh install-tagger.sh

tput bold && echo "Cleanup" && tput sgr0
rm -rf install-tagger.sh tree-tagger-MacOSX-3.2-intel.tar.gz tree-tagger-linux-3.2.tar.gz tagger-scripts.tar.gz english-par-linux-3.2-utf8.bin.gz english-chunker-par-linux-3.2-utf8.bin.gz

echo ""
echo "###############"
echo "# Mecab"
echo "###############"

mkdir -p ${DIR}/mecab
cd ${DIR}/mecab > /dev/null

tput bold && echo "Download mecab-0.996.tar.gz" && tput sgr0
curl -# -L "https://drive.google.com/uc?export=download&id=0B4y35FiV1wh7cENtOXlicTFaRUE" > mecab-0.996.tar.gz

tput bold && echo "Download UniDic for Early Middle Japanese ver1.4" && tput sgr0
curl -# -O "https://dl.dropboxusercontent.com/u/134600/unidic-EMJ_14.zip"

echo ""
tput bold && echo "Install Mecab" && tput sgr0

tar zxfv mecab-0.996.tar.gz
mkdir -p ${DIR}/mecab/mecab
cd ${DIR}/mecab/mecab-0.996 > /dev/null
./configure --prefix=${DIR}/mecab/mecab --with-charset=utf8
make
make install

echo ""
tput bold && echo "Install UniDic" && tput sgr0
cd ${DIR}/mecab > /dev/null
unzip unidic-EMJ_14.zip
cp -r ${DIR}/mecab/unidic-EMJ_14/Files/dic/unidic-mecab ${DIR}/mecab/unidic-cj
sed -e "s|@@DICDIR@@|${DIR}/mecab/unidic-cj|g" ${DIR}/mecab/.mecabrc > ${DIR}/mecab/unidic-cj/.mecabrc-cj

echo ""
tput bold && echo "Cleanup" && tput sgr0
cd ${DIR}/mecab > /dev/null
rm -rf mecab-0.996.tar.gz mecab-0.996 unidic-EMJ_14.zip unidic-EMJ_14

echo ""
echo "----------------------"
echo "Done!!"
