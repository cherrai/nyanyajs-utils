#! /bin/bash
name="nyanyajs-utils"
port=23200
branch="main"
# configFilePath="config.dev.json"
configFilePath="config.pro.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("start ")

start() {
  echo "-> 正在启动「${name}」服务"

  cd ./src/webAssembly/go-wasm
  ./release.sh build
  cd ../../..
  yarn pub
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"
