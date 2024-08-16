#! /bin/bash
appName="nyanyajs-utils-wasm"
name="${appName}"
port=16111
version="v1.0.0"
branch="main"
# configFilePath="config.dev.json"
# webConfigFilePath="config.pro.temp.json"
webConfigFilePath="config.pro.web.json"
electronConfigFilePath="config.pro.electron.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("build el:icon el:install el:run el:build push run protos stop npmconfig install gitpull dockerremove start logs")

build() {
  echo "-> 正在编译「${name}<$version>」服务"

  # targetDir="../../../../../meow-sticky-note/meow-sticky-note-client/public/"
  # targetDir="../../../../../meow-sticky-note/meow-sticky-note-client/src/modules/webAssembly/dist/"
  # targetDir="../../../../..//nyanya/nyanya-toolbox/public/"
  targetDir="../dist/"
  mkdir -p ${targetDir}
  # rm -rf ${targetDir}*

  # tinygo build -o ${targetDir}${appName}.wasm -target wasm ./main.go
  # # tinygo build -o ../${appName}.wasm -target wasm ./main.go
  # cp $(tinygo env TINYGOROOT)/targets/wasm_exec.js ${targetDir}

  GOOS=js GOARCH=wasm go build -o ${targetDir}${appName}.wasm ./main.go
  cp $(go env GOROOT)/misc/wasm/wasm_exec.js ${targetDir}
  cp $(go env GOROOT)/misc/wasm/wasm_exec.html ${targetDir}

  # node
  #   cp $(shell go env GOROOT)/misc/wasm/wasm_exec_node.js ./dist/
  # node ./dist/wasm_exec_node.js ./dist/main.wasm
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"

#  "dmg": {
#  	"contents": [
#  		{
#  			"x": 410,
#  			"y": 150,
#  			"type": "link",
#  			"path": "/Applications"
#  		},
#  		{
#  			"x": 130,
#  			"y": 150,
#  			"type": "file"
#  		}
#  	]
#  },
#  "mac": {
#  	"icon": "build/icons/icon.icns"
#  },
#  "win": {
#  	"icon": "build/icons/icon.ico"
#  },
