package net

import (
	"net"
	"os/exec"
	"syscall/js"

	"github.com/cherrai/nyanyago-utils/validation"
)

func LookupIP(this js.Value, args []js.Value) interface{} {
	result := js.Global().Get("String").New("")

	options := struct {
		Url string
	}{
		Url: args[0].String(),
	}
	log.Info("options", options)
	if err := validation.ValidateStruct(
		&options,
		validation.Parameter(&options.Url,
			validation.Type("string"), validation.Required()),
	); err != nil {
		log.Error(err)
		return result
	}

	cmd := exec.Command("ping", "aiiko.club")
	log.Info(cmd.Output())
	ips, err := net.LookupIP("aiiko.club")
	if err != nil {
		log.Error(err)
		return result
	}

	for _, ip := range ips {
		result = js.Global().Get("String").New(ip.String())
	}
	return result
}
