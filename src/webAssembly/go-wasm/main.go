//go:build js && wasm
// +build js,wasm

package main

import (
	// "github.com/cherrai/nyanyajs-utils/webAssembly/methods/test"
	"syscall/js"

	// "github.com/cherrai/dhkea-go"
	// "github.com/cherrai/nyanyago-utils/cipher"
	"github.com/cherrai/nyanyago-utils/nlog"
	mimages "github.com/cherrai/nyanyajs-utils/webAssembly/src/images"
	// mvideos "github.com/cherrai/nyanyajs-utils/webAssembly/src/videos"
	// "github.com/cherrai/nyanyajs-utils/webAssembly/methods/test"
)

var (
	log = nlog.New()
)

func init() {
	nlog.SetPrefixTemplate("[{{Timer}}] [{{Type}}] [{{Date}}] [{{File}}]@{{Name}}")
	nlog.SetName("GoWasm")
}

func main() {
	js.Global().Set("nyanyajs-wasm", js.ValueOf(map[string]any{
		"images": mimages.ExportJS(),
		// "net":    net.ExportJS(),
		// "video":  mvideos.ExportJS(),
		// "aes": js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// 	log.Info("args", args)
		// 	aes := cipher.AES{
		// 		Key:  "11111111111111111111111111111111",
		// 		Mode: "CFB",
		// 	}
		// 	log.Info(args[0].String())
		// 	v, err := aes.Encrypt(args[0].String(), "")
		// 	log.Error(err)
		// 	return js.Global().Get("String").New(v.HexEncodeToString())
		// }),
	}))
	log.Info("Running in NyaNyaJS-GoWasm")

	test()
	// go test.Test()
	<-make(chan int)

}

func test() {
}
