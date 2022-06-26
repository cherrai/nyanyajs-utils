// 时间队列
export class QueueLoop {
	global: boolean = false
	delayms: number = 1000
	queue: {
		func: (key: string) => void
		key: string
		options?: {
			loop?: boolean
			count?: number
			currentCount: number
		}
	}[] = []
	timer: any

	constructor(options?: { global?: boolean; delayms?: number }) {
		options?.global && (this.global = options.global)
		options?.delayms && (this.delayms = options.delayms)
		this.run()
	}
	run() {
		this.timer = setInterval(() => {
			this.queue.length &&
				this.queue.forEach((item) => {
					item.func(item.key)
					if (item.options && !item.options?.loop) {
						if (!item.options.currentCount) {
							item.options.currentCount = 1
						}
						if (item.options.currentCount >= item.options.count) {
							this.decrease(item.key)
							return
						}
						item.options.currentCount++
					}
				})

			if (!this.queue.length) {
				this.timer && clearInterval(this.timer)
			}
		}, this.delayms)
	}
	increase(
		key: string,
		callback: (key: string) => void,
		options?: {
			loop?: boolean
			count?: number
		}
	) {
		if (!this.queue.length) this.run()
		if (this.queue.filter((item) => item.key === key).length) return
		this.queue.push({
			key,
			func: callback,
			options: options
				? {
						...options,
						currentCount: 0,
				  }
				: {
						loop: false,
						count: 1,
						currentCount: 0,
				  },
		})
	}
	decrease(key: string) {
		this.queue = this.queue.filter((item) => {
			return item.key !== key
		})
	}
	decreaseAll() {
		this.queue = []
	}
}
export default QueueLoop
