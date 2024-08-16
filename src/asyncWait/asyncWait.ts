type F = () => void

export class AsyncWait {
	private handlers: {
		[s: string]: F[]
	} = {}
	// private handlers: {
	// 	[s: string]: F[][]
	// } = {}
	// constructor() {}

	// // 同一个key也要分先后顺序

	// new(key: string) {
	// 	return {
	// 		waiting: () => {
	// 			return new Promise((resolve, reject) => {
	// 				try {
	// 					if (!this.handlers[key] || !this.handlers[key].length) {
	// 						this.handlers[key] = []

	// 						resolve(true)
	// 						return
	// 					}

	// 					const tempHandlers: F[] = []

	// 					this.handlers[key].push(tempHandlers)

	// 					this.handlers[key].concat([
	// 						() => {
	// 							resolve(true)
	// 						},
	// 					])
	// 				} catch (error) {
	// 					reject(error)
	// 				}
	// 			})
	// 		},

	// 		resolve: () => {
	// 			this.handlers[key]?.forEach((v) => {
	// 				v?.()
	// 			})
	// 			this.handlers[key] = []
	// 		},
	// 	}
	// }

	waiting(key: string) {
		return new Promise((resolve, reject) => {
			try {
				console.log('waitingwaiting', this.handlers[key]?.length)
				if (!this.handlers[key]) {
					this.handlers[key] = []
				}

				this.handlers[key].push(() => {
					resolve(true)
				})
				if (this.handlers[key].length === 1) {
					resolve(true)
				}
			} catch (error) {
				reject(error)
			}
		})
	}

	resolve(key: string) {
		console.log('waitingwaiting11111', this.handlers[key]?.length)

		if (!this.handlers[key]?.length) {
			return
		}
		const f = this.handlers[key].shift()

		f()
		// this.handlers[key]?.forEach((v) => {
		// 	v?.()
		// })
		// this.handlers[key] = []
	}
}
