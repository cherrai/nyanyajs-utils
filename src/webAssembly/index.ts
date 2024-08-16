// import WASM from './dist/wasm_exec'

export class NyaNyaWasm {
	static wasmPath = '/nyanyajs-utils-wasm.wasm'
	static coreJsPath = '/wasm_exec.js'
	static setWasmPath(wasmPath: string) {
		NyaNyaWasm.wasmPath = wasmPath
	}
	static setCoreJsPath(coreJsPath: string) {
		NyaNyaWasm.coreJsPath = coreJsPath
	}
	static Wasm: NyaNyaWasm
	static WasmAPI() {
		!NyaNyaWasm.Wasm && (NyaNyaWasm.Wasm = new NyaNyaWasm())

		return NyaNyaWasm.Wasm.api()
	}

	private loaded = false
	private wasmAPI: any
	constructor() {}
	private wasmBrowserInstantiate = async (
		wasmModuleUrl: string,
		importObject: any
	) => {
		let response = undefined

		// Check if the browser supports streaming instantiation
		if (WebAssembly.instantiateStreaming) {
			// Fetch the module, and instantiate it as it is downloading
			response = await WebAssembly.instantiateStreaming(
				fetch(wasmModuleUrl),
				importObject
			)
		} else {
			// Fallback to using fetch to download the entire module
			// And then instantiate the module
			const fetchAndInstantiateTask = async () => {
				const wasmArrayBuffer = await fetch(wasmModuleUrl).then((response) =>
					response.arrayBuffer()
				)
				return WebAssembly.instantiate(wasmArrayBuffer, importObject)
			}

			response = await fetchAndInstantiateTask()
		}

		return response
	}
	public load() {
		return new Promise(async (res, rej) => {
			try {
				if (this.loaded) return

				let isExists = false
				document.head.querySelectorAll('script').forEach((v) => {
					if (v.src.indexOf('wasm_exec.js') >= 0) {
						isExists = true
					}
				})
				if (!isExists) {
					const el = document.createElement('script')
					el.src = NyaNyaWasm.coreJsPath
					document.head.appendChild(el)
					el.onload = async () => {
						await this.loadWasm()
						res(null)
					}
				} else {
					await this.loadWasm()
					res(null)
				}
			} catch (error) {
				console.error(error)
			}
		})
	}
	private async loadWasm() {
		const win = window as any
		const goWasm = new win['Go']()
		// goWasm.importObject.env['syscall/js.finalizeRef'] = () => {}

		const importObject = {
			...goWasm.importObject,
			// memory: new WebAssembly.Memory({
			// 	initial: 256,
			// }),
		}
		// console.log(' goWasm.importObject', importObject)
		const wasmModule = await this.wasmBrowserInstantiate(
			NyaNyaWasm.wasmPath,
			importObject
		)
		// const exports: any = wasmModule.instance.exports
		// Allow the wasm_exec go instance, bootstrap and execute our wasm module
		goWasm.run(wasmModule.instance)
		this.loaded = true

		this.wasmAPI = win?.['nyanyajs-wasm']
	}
	public isLoaded() {
		return this.loaded
	}

	public async api() {
		try {
			if (!this.loaded) {
				await this.load()
			}
			if (!this.wasmAPI) {
				console.error("Wasm API doesn't exist")
				return
			}
			const _this = this
			const wasmAPI = this.wasmAPI
			const api = {
				isLoad() {
					return _this.isLoaded()
				},
				images: {
					async resize(
						u8a: Uint8Array,
						options: {
							maxPixel?: number
							width?: number
							height?: number
							quality: number
						}
					): Promise<{
						result: Uint8Array
						width: number
						height: number
					}> {
						options.quality && (options.quality = options.quality * 100)
						return await wasmAPI?.images?.resize(u8a, options)
					},
				},
				net: {
					async lookupIP(url: string): Promise<string> {
						return await wasmAPI?.net?.lookupIP(url)
					},
				},
			}
			return api
		} catch (error) {
			console.error(error)
		}
	}
}

export default {
	NyaNyaWasm,
}
