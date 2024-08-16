// 一个一个的走
export interface AsyncQueueOptions {}
// 曾经叫RunQueue
export class AsyncQueue {
	private count: number = 0
	private queue: {
		key: string
		index: number
		func: () => Promise<void>
		callback: () => Promise<void>
	}[] = []
	constructor(optins?: AsyncQueueOptions) {}
	public increase(func: () => Promise<void>, key: string) {
		this.count++
		this.queue.push({
			key,
			index: this.count,
			func,
			callback: async () => {
				const queue = this.queue[0]
				await queue.func()
				this.queue = this.queue.filter((v) => {
					return v.index !== queue.index
				})
				if (!this.queue.length) {
					return
				}
				await this.queue[0].callback()
			},
		})
		// console.log('this.queue.length === 1', this.queue.length === 1)
		if (this.queue.length === 1) {
			this.queue[0].callback().then()
		}
	}
	public decrease(key: string) {
		this.queue = this.queue.filter((v) => {
			return v.key !== key
		})
	}
	public decreaseAll() {
		this.queue = []
	}
}
