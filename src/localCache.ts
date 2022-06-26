import md5 from 'blueimp-md5'

// export type Storage = {
// 	NyaNyaDB?: {
// 		enable: boolean
// 		model: any
// 	}
// }
export type InitHandlerType<K, T> = () => Promise<
	{
		key: K
		value: T
	}[]
>
export type OnChangeHandlerType<K, T> = ({}: {
	key: K
	value: T | null
	type: 'Set' | 'Delete'
}) => void
export type OnHandlerType<K, T> = ({}: {
	key: K
	value: T | null
	type: 'Get' | 'Set' | 'Delete'
}) => void
export class LocalCache<K = string, T = any> {
	mapCache: Map<string, T>
	persistence: boolean

	// storage?: Storage
	key: string
	platform: 'Electron' | 'Web'
	private mustGetHandlers?: (k: K) => Promise<T>
	private onChangeHandlers: OnChangeHandlerType<K, T>[] = []
	private onHandlers: OnHandlerType<K, T>[] = []
	private initHandlers: InitHandlerType<K, T>[] = []

	constructor(options: {
		persistence?: boolean
		key: string
		// storage?: Storage
		platform: 'Electron' | 'Web'

		OnChange?: OnChangeHandlerType<K, T>
		OnHandler?: OnHandlerType<K, T>
		Init?: InitHandlerType<K, T>
		MustGet?: (k: K) => Promise<T>
	}) {
		// options.storage && (this.storage = options.storage)
		this.persistence = options.persistence || false
		this.platform = options.platform
		this.key = options.key
		options?.MustGet && (this.MustGet = options?.MustGet)
		this.mapCache = new Map()
		options?.Init && this.initHandlers.push(options.Init)
		options?.OnChange && this.onChangeHandlers.push(options.OnChange)
		options?.OnHandler && this.onHandlers.push(options.OnHandler)
		this.init()
	}
	init() {
		// 这里要进行AES加密
		console.log(this.key, this.persistence)
		this.initHandlers.forEach(async (initFunc) => {
			const data = await initFunc()
			// console.log('data', data)
			data.forEach((item) => {
				this.mapCache.set(this.getKey(item.key), item.value)
			})
		})
		// if (!this.storage) return
		// if (this?.storage?.NyaNyaDB) {
		// 	this.storage?.NyaNyaDB.model
		// 		.Find()
		// 		.Result()
		// 		.then((res: any) => {
		// 			console.log('Find', res)
		// 		})
		// 		.catch((err: any) => {
		// 			console.log(err)
		// 		})
		// }
		// const key = this.getKey<string>(this.key)
		// const data = localStorage.getItem(key)
		// if (data) {
		// 	const json = JSON.parse(AES.decrypt(data, key, key))
		// 	Object.keys(json).forEach((k) => {
		// 		this.mapCache.set(k, json[k])
		// 	})
		// }
	}
	updateCache() {
		// 这里要进行AES加密
		const key = this.getKey<string>(this.key)
		// this.persistence &&
		// 	localStorage.setItem(key, AES.encrypt(this.ToJSON(), key, key).value)
	}

	OnChange(
		callback: ({}: { key: K; value: T | null; type: 'Set' | 'Delete' }) => void
	) {
		this.onChangeHandlers.push(callback)
	}

	OnHandler(callback: OnHandlerType<K, T>) {
		this.onHandlers.push(callback)
	}

	getKey<T = K>(k: T) {
		return md5('localCache' + k)
	}
	ToValues() {
		let arr: T[] = []
		for (let v of this.mapCache.values()) {
			arr.push(v)
		}
		return arr
	}
	// 构思下假如10万条数据，electron该如何缓存
	ToValuesByPage(limit: number, skip: number) {
		return this.ToValues().slice(skip, skip + limit)
	}
	ToKeys() {
		let arr: string[] = []
		for (let v of this.mapCache.keys()) {
			arr.push(v)
		}
		return arr
	}
	ToJSON() {
		let json: any = {}
		for (let key of this.mapCache.keys()) {
			json[key] = this.mapCache.get(key)
		}
		return json
	}
	// async Update(callback: (json: Object) => Promise<Object>) {
	// 	const jsonData: any = await callback(this.ToJSON())

	// 	Object.keys(jsonData).forEach((k) => {
	// 		this.mapCache.set(k, jsonData[k])
	// 	})
	// 	this.updateCache()
	// }
	Set(k: K, v: T) {
		this.mapCache.set(this.getKey(k), v)
		// this.updateCache()
		this.onChangeHandlers.forEach((func) => {
			func({
				key: k,
				value: v,
				type: 'Set',
			})
		})
		this.onHandlers.forEach((func) => {
			func({
				key: k,
				value: v,
				type: 'Set',
			})
		})
	}
	Get(k: K): T {
		const value = this.mapCache.get(this.getKey(k))

		this.onHandlers.forEach((func) => {
			func({
				key: k,
				value: value,
				type: 'Get',
			})
		})
		return value
	}
	GetIndex(k: K): number {
		let index = -1
		const getK = this.getKey(k)
		for (let key of this.mapCache.keys()) {
			index++
			if (key === getK) {
				break
			}
		}
		return index
	}
	async MustGet(k: K) {
		if (this?.mustGetHandlers) {
			try {
				const value = this.Get(k)
				// console.log('MustGet !value', value)
				if (!value) {
					const v = await this.mustGetHandlers(k)
					this.Set(k, v)
					return v
				} else {
					return value
				}
			} catch (error) {
				console.log(error)
				throw error
			}
		}
	}
	Has(k: K) {
		return this.mapCache.has(this.getKey(k))
	}
	Delete(k: K) {
		const isDelete = this.mapCache.delete(this.getKey(k))
		this.updateCache()
		this.onChangeHandlers.forEach((func) => {
			func({
				key: k,
				value: null,
				type: 'Delete',
			})
		})
		this.onHandlers.forEach((func) => {
			func({
				key: k,
				value: null,
				type: 'Delete',
			})
		})
		return isDelete
	}
	Size() {
		return this.mapCache.size
	}
	Clear() {}
}

export default LocalCache
