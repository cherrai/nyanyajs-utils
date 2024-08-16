//go:build js && wasm
// +build js,wasm

package mcipher

import (
	"syscall/js"

	"github.com/cherrai/nyanyago-utils/nlog"
)

var (
	log = nlog.New()
)

func ExportJS() map[string]any {
	return map[string]any{}
}
