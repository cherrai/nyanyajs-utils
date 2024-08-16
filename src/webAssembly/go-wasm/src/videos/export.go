//go:build js && wasm
// +build js,wasm

package mvideos

import (
	"github.com/cherrai/nyanyajs-utils/webAssembly/src/middleware"

	"github.com/cherrai/nyanyago-utils/nlog"
)

var (
	log = nlog.New()
)

func ExportJS() map[string]any {
	return map[string]any{
		"resize": middleware.JSFuncOf(Resize),
	}
}
