//go:build js && wasm
// +build js,wasm

package mimages

import (
	"github.com/cherrai/nyanyago-utils/nimages"
	"github.com/cherrai/nyanyago-utils/validation"
	"image"
	// "io/fs"

	// "github.com/psanford/memfs"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	// "io/ioutil"
	"bytes"
	"syscall/js"
)

func Resize(this js.Value, args []js.Value) interface{} {
	result := js.Global().Get("Object").New(map[string]any{
		"result": js.Global().Get("Uint8Array").New(0),
		"width":  0,
		"height": 0,
	})
	if len(args) != 2 || args[0].IsNull() || args[1].IsNull() {
		log.Error("Parameter does not exist")
		return result
	}
	srcBytes := make([]byte, args[0].Get("length").Int())
	js.CopyBytesToGo(srcBytes, args[0])

	options := struct {
		MaxPixel int
		Width    int
		Height   int
		Quality  int
	}{
		MaxPixel: args[1].Get("maxPixel").Int(),
		Width:    args[1].Get("width").Int(),
		Height:   args[1].Get("height").Int(),
		Quality:  args[1].Get("quality").Int(),
	}
	// log.Info("options", options.Quality)
	// 3、校验参数
	if err := validation.ValidateStruct(
		&options,
		validation.Parameter(&options.MaxPixel,
			validation.Type("int")),
		validation.Parameter(&options.Width,
			validation.Type("int")),
		validation.Parameter(&options.Height,
			validation.Type("int")),
		validation.Parameter(&options.Quality,
			validation.Type("int"), validation.Required()),
	); err != nil {
		log.Error(err)
		return result
	}

	reader := bytes.NewReader(srcBytes)
	buffer, err := nimages.Resize(reader,
		options.MaxPixel,
		options.Width,
		options.Height,
		options.Quality,
	)
	if err != nil {
		log.Error(err)
		return nil
	}
	outputBytes := buffer.Bytes()
	jsArray := js.Global().Get("Uint8Array").New(len(outputBytes))
	js.CopyBytesToJS(jsArray, outputBytes)

	img, _, err := image.DecodeConfig(bytes.NewReader(buffer.Bytes()))
	if err != nil {
		log.Error(err)
		return nil
	}

	result.Set("result", jsArray)
	result.Set("width", img.Width)
	result.Set("height", img.Height)
	return result

}
