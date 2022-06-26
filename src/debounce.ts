export class Debounce {
	private timer: NodeJS.Timeout
	constructor() {}

	increase(func: () => void, timeout: number) {
		clearTimeout(this.timer)
		this.timer = setTimeout(() => {
			func()
		}, timeout)
	}
}

export default Debounce
