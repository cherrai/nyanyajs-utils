type F<V = any> = (value?: V) => void
export class NEventListener<E = string> {
	private handlers: {
		[s: string]: F[]
	} = {}
	constructor() {}
	public on<V = any>(event: E, func: F<V>) {
		if (!func) return
		let s: string = String(event)
		if (!this.handlers[s]) {
			this.handlers[s] = [func]
		} else {
			this.handlers[s] = this.handlers[s].concat([func])
		}
	}
	public dispatch<V = any>(event: E, value?: V) {
		let s: string = String(event)
		this.handlers[s]?.forEach((v) => {
			v?.(value)
		})
	}
}
