package middleware

import (
	"reflect"
	"runtime"
	"strings"
	"syscall/js"
)

type MiddlewareFuncType = func(fi *JSFuncInstance) error

type MiddlewareFuncTypes []MiddlewareFuncType

type JSFuncInstance struct {
	This               js.Value
	Args               []js.Value
	FuncName           string
	f                  func(this js.Value, args []js.Value) any
	Error              error
	Index              int
	Result             any
	MiddlewareHandlers MiddlewareFuncTypes
}

func JSFuncOf(f func(this js.Value, args []js.Value) any) js.Func {
	fn := strings.Split(runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name(), "/")

	funcName := fn[len(fn)-1]
	return js.FuncOf(
		func(this js.Value, args []js.Value) any {
			this.Set("FuncName", funcName)

			fChan := make(chan any)
			go func() {
				fi := &JSFuncInstance{
					This:     this,
					Args:     args,
					FuncName: funcName,
					f:        f,
					Index:    -1,
					MiddlewareHandlers: MiddlewareFuncTypes{
						Error(),
						RunTime(),
					},
				}

				fi.Next()

				fChan <- fi.Result
			}()

			return <-fChan
		},
	)

}

func (fi *JSFuncInstance) Next() {
	fi.Index++
	if fi.Index < len(fi.MiddlewareHandlers) {
		fi.Error = fi.MiddlewareHandlers[fi.Index](fi)
	} else {
		fi.Result = fi.f(fi.This, fi.Args)
	}
}
