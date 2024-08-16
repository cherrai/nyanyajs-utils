//go:build js && wasm
// +build js,wasm

package net

import (
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyajs-utils/webAssembly/src/middleware"
)

var (
	log = nlog.New()
)

func ExportJS() map[string]any {
	return map[string]any{
		"lookupIP": middleware.JSFuncOf(LookupIP),
	}
}
