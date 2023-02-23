export class Wait {
	private handlers: {
		[k: string]: {
			fl: (() => void)[]
			status: number
		}
	} = {}
	async waiting(key: string = 'wait') {
		return new Promise((res) => {
			!this.handlers[key] &&
				(this.handlers[key] = {
					status: 0,
					fl: [],
				})
			if (this.handlers[key].status === 1) {
				res(undefined)
				return
			}
			this.handlers[key].fl.push(() => {
				res(undefined)
			})
		})
	}
	dispatch(key: string = 'wait') {
		!this.handlers[key] &&
			(this.handlers[key] = {
				status: 0,
				fl: [],
			})
		console.log(this.handlers)
		this.handlers[key].status = 1
		this.handlers[key].fl.forEach((v) => {
			v()
		})
		this.handlers[key].fl = []
	}
}
