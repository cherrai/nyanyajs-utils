//go:build js && wasm
// +build js,wasm

package middleware

import ()

func Error() MiddlewareFuncType {
	return func(fi *JSFuncInstance) error {
		defer func() {
			if err := recover(); err != nil {
				fi.Error = err.(error)
			}

			if fi.Error != nil {
				log.FullCallChain("<"+fi.FuncName+">"+" GoWasm Error: "+fi.Error.Error(), "Error")
			}
		}()
		fi.Next()
		return nil
	}
}
