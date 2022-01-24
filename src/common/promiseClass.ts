export class PromiseClass<T = any> implements PromiseLike<T> {
	constructor(defaultValue: T | undefined | null) {
		this.value = defaultValue
	}
	value: T | undefined | null
	response: T | undefined | null
	error: unknown
	reject(error: unknown) {
		this.error = error
		console.log(error)
	}
	then<TResult1 = T, TResult2 = never>(
		onfulfilled?:
			| ((value: T) => TResult1 | PromiseLike<TResult1>)
			| undefined
			| null,
		onrejected?:
			| ((reason: any) => TResult2 | PromiseLike<TResult2>)
			| undefined
			| null
	): PromiseClass {
		// console.log(onrejected)
		const _this = this
		if (this.error) {
			if (onrejected) {
				onrejected(this.error)
				this.error = ''
				return this
			}
		} else {
			if (onfulfilled && this.response) {
				onfulfilled(this.response)
				return this
			}
		}
		new Promise((res, rej) => {
			console.log(_this.error)
			if (_this.error) {
				rej(_this.error)
			} else {
				res(null)
			}
		})
			.then()
			.catch((rej) => {
				if (_this.error) {
					throw _this.error
				}
			})
		// new PromiseClass('final').then(
		// 	() => {},
		// 	() => {
		// 		console.log('最后', _this.error)
		// 		if (_this.error) {
		// 			throw _this.error
		// 		}
		// 	}
		// )
		return this
	}
	catch<TResult2 = never>(
		onrejected?:
			| ((reason: any) => TResult2 | PromiseLike<TResult2>)
			| undefined
			| null
	) {
		console.log('catch函数', this)
		if (this.error) {
			if (onrejected) {
				onrejected(this.error)
				this.error = ''
				return
			}
			throw this.error
		}
	}
}
