//go:build js && wasm
// +build js,wasm

package mimages

import (
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyajs-utils/webAssembly/src/middleware"
)

var (
	log = nlog.New()
)

func ExportJS() map[string]any {
	return map[string]any{
		"resize": middleware.JSFuncOf(Resize),
	}
}
