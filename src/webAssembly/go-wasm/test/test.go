package main

import (
	"github.com/cherrai/nyanyago-utils/nimages"

	// "github.com/cherrai/dhkea-go"
	"github.com/cherrai/nyanyago-utils/nlog"
	// "github.com/cherrai/nyanyajs-utils/webAssembly/src/test"
)

var (
	log = nlog.New()
)

func main() {

	// test.Fib()
	err := nimages.ResizeByPath(
		"./1addc2098b494e465c2349a372d4534d1644010129962.jpeg",
		"./1.jpeg",
		1920, 0, 0, 1)
	log.Info(err)
}
