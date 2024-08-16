import { NEventListener } from '../common/neventListener'

export class WebWorker<K = string> extends NEventListener {
	scriptURL: string
	worker: Worker
	static workers: {
		[url: string]: WebWorker<any>
	} = {}
	constructor(scriptURL: string) {
		super()

		this.scriptURL = scriptURL
		this.worker = new Worker(scriptURL)
		this.worker.addEventListener('error', (e) => {
			console.log(e)
			delete WebWorker.workers[scriptURL]
		})
		this.worker.addEventListener('message', (e) => {
			this.dispatch('message', e.data)
			if (e.data?.method) {
				this.dispatch(e.data?.method, e.data.response)
			}
		})
		this.worker.addEventListener('messageerror', (e) => {
			console.log(e)
		})
		// this.worker.postMessage

		WebWorker.workers[scriptURL] = this
	}

	postMessage<R = any>(
		method: K,
		params: {
			[k: string]: any
		}
	) {
		return new Promise<R>((res, rej) => {
			try {
				this.worker.postMessage({
					method,
					params,
				})
				this.on(method as any, (r) => {
					res(r)
				})
			} catch (error) {
				rej(error)
			}
		})
	}
	terminate() {
		this.worker.terminate()
		delete WebWorker.workers[this.scriptURL]
	}

	static onMessage<T = string>(
		f: (
			method: T,
			params: {
				[k: string]: any
			}
		) => void
	) {
		self.addEventListener('message', (e) => {
			if (e.data?.method) {
				f(e.data?.method, e.data?.params)
			}
		})
	}

	static postMessage(
		method: string,
		response: {
			[k: string]: any
		}
	) {
		self.postMessage({
			method,
			response,
		})
	}
}
