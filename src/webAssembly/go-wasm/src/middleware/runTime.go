//go:build js && wasm
// +build js,wasm

package middleware

import (
	"github.com/cherrai/nyanyago-utils/nlog"
)

var (
	log = nlog.New()
)

func RunTime() MiddlewareFuncType {
	return func(fi *JSFuncInstance) error {
		lt := log.Time()
		defer lt.TimeEnd("<" + fi.FuncName + ">" + ", Running Time =>")
		fi.Next()
		return nil
	}
}
