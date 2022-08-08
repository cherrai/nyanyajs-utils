import { NyaNyaDB, IndexedDB } from '@nyanyajs/nyanyadb'
import md5 from 'blueimp-md5'
import { RunQueue } from '../runQueue'
export interface StorageOptions {
	storage?: 'LocalStorage' | 'IndexedDB' | 'ElectronNodeFsStorage'
	baseLabel: string
	encryption?: {
		enable: boolean
		key?: string
	}
}
export interface Value<T> {
	value: T
	expiration: number
}
export interface NyaNyaDBStorageSchema {
	key: string
	data: string
	options: string
	label: string
}

// console.log('WebStorageWebStorage')

const nyanyadb = new NyaNyaDB({
	databaseName: 'WebStorage',
	version: 1,
})

const model = nyanyadb.CreateModel(
	new NyaNyaDB.Schema<NyaNyaDBStorageSchema>({
		id: {
			type: Number,
			primaryKey: true,
			createIndex: true,
			autoIncrement: true,
		},
		key: {
			type: String,
			required: true,
			createIndex: true,
		},
		data: {
			type: String,
			required: true,
		},
		options: {
			type: String,
			default: '{}',
		},
		label: {
			type: String,
			required: true,
			createIndex: true,
		},
	}),
	'storage'
)

export class WebStorage<K = string, T = any> {
	static globalEncryptionKey = ''
	static nyanyadb = nyanyadb
	static model = model
	private storage: StorageOptions['storage'] = 'IndexedDB'
	private encryption: StorageOptions['encryption'] = {
		enable: false,
	}
	private baseLabel: string = ''
	private label: string = ''
	public map: {
		[key: string]: Value<T>
	} = {}
	static storageKeys: WebStorage<string, string[]>
	public keys: K[] = []
	private rq: RunQueue
	private changeLabelHandlers: (() => void)[] = []
	constructor(options: StorageOptions) {
		this.rq = new RunQueue()
		options.storage && (this.storage = options.storage)
		options.baseLabel && (this.baseLabel = options.baseLabel)
		this.setLabel(options.baseLabel)
		if (options?.encryption?.enable) {
			if (!this.encryption) {
				this.encryption = {
					enable: false,
				}
			}
			this.encryption.enable = true
			if (options.encryption.key) {
				this.encryption.key = options.encryption.key
			} else {
				this.encryption.key = WebStorage.globalEncryptionKey
			}
		}
		if (options?.storage === 'IndexedDB' && !WebStorage.nyanyadb) {
		}

		if (options.storage === 'LocalStorage') {
			this.initKeys()
		}

		// if (this.storage === 'ElectronNodeFsStorage') {
		// 	WebStorage.electronNodeFsStorageMethods
		// 		.request({
		// 			type: 'init',
		// 			label: this.label,
		// 		})
		// 		.then()
		// }
	}
	private initKeys() {
		// console.log('initKeys')
		// this.updateKeys()
		this.rq.increase(async () => {
			let v = await WebStorage.storageKeys.get(this.label)

			!v && (v = [])
			v.forEach((sv) => {
				const k = JSON.parse(sv)
				let isExist = false
				this.keys.some((ssv) => {
					if (ssv === k.key) {
						isExist = true
						return true
					}
				})
				if (!isExist) {
					this.keys.push(k.key)
				}
			})
		}, 'initKeys')
	}
	private updateKeys() {
		this.rq.increase(async () => {
			await WebStorage.storageKeys.getAndSet(this.label, async (v) => {
				!v && (v = [])

				this.keys.forEach((sv) => {
					const k = JSON.stringify({
						key: sv,
					})
					let isExist = false
					v.some((ssv) => {
						if (ssv === k) {
							isExist = true
							return true
						}
					})
					if (!isExist) {
						v.push(k)
					}
				})

				return v
			})
			// console.log(this.keys, this)
		}, 'updateKeys')
	}

	static electronNodeFsStorageRequestObj: {
		[requestId: string]: any
	} = {}
	static electronNodeFsStorageMethods = {
		getParams(data: {
			type: string
			label: string
			key?: string
			expiration?: number
			value?: any
		}) {
			const obj = {
				...data,
				requestId: '',
				requestTime: new Date().getTime(),
			}
			obj.requestId = md5(JSON.stringify(obj))
			// console.log(obj.type, obj.requestId)
			return obj
		},
		requestFunc: (
			requestId: string,
			func: (data: {
				requestId: string
				requestTime: number
				type: string
				label: string
				key: string
				value?: any
			}) => void
		) => {
			WebStorage.electronNodeFsStorageRequestObj[requestId] = func
		},
		request(data: {
			type:
				| 'setLabel'
				| 'init'
				| 'get'
				| 'getAndSet'
				| 'getAll'
				| 'set'
				| 'delete'
				| 'deleteAll'
			label: string
			key?: string
			value?: any
			expiration?: number
			options?: any
		}) {
			return new Promise<any>((resolve, reject) => {
				try {
					if (typeof window === 'undefined' || !window?.require) {
						reject('Non-electron environment')
						return
					}
					const { getParams, requestFunc } =
						WebStorage.electronNodeFsStorageMethods

					const electron = window?.require?.('electron')

					if (!electron) {
						return
					}
					const { ipcRenderer } = electron
					const params = getParams(data)
					ipcRenderer?.send?.('NodeFsStoragerAPI', params)
					requestFunc(params.requestId, (data) => {
						resolve(data.value)
					})
				} catch (error) {
					reject(error)
				}
			})
		},
	}
	static electronNodeFsStorageStatus = false
	static electronNodeFsStorageInit() {
		if (typeof window === 'undefined' || !window?.require) return

		if (WebStorage.electronNodeFsStorageStatus) return
		console.log(window)
		const electron = window?.require?.('electron')

		if (!electron) {
			return
		}
		const { ipcRenderer } = electron

		ipcRenderer.on(
			'NodeFsStorageROUTER',
			(
				event,
				arg: {
					requestId: string
					requestTime: number
					type: string
					label: string
					key: string
					value?: any
				}
			) => {
				// console.log(arg, requestObj, !!requestObj[arg.requestId])
				WebStorage.electronNodeFsStorageRequestObj?.[arg.requestId]?.(arg)
			}
		)
		WebStorage.electronNodeFsStorageStatus = true

		return
	}
	public getLabel() {
		return this.baseLabel
	}
	public getBaseLabel() {
		return this.baseLabel
	}
	changeLabel(func: () => void) {
		this.changeLabelHandlers.push(func)
	}

	public setLabel(label: string) {
		if (this.storage === 'ElectronNodeFsStorage') {
			WebStorage.electronNodeFsStorageMethods
				.request({
					type: 'setLabel',
					label: label,
					options: {
						oldLabel: this.label,
					},
				})
				.then()
		}
		this.label = label
		if (this.storage === 'LocalStorage') {
			this.initKeys()
		}
		this.changeLabelHandlers.forEach((v) => {
			v()
		})
	}
	private getValue(value: any, expiration: number) {
		const obj: Value<T> = {
			value: value,
			expiration: -1,
		}
		if (expiration) {
			obj.expiration = new Date().getTime() + expiration
		}
		return {
			toString() {
				return JSON.stringify(obj)
			},
			toJson() {
				return obj
			},
		}
	}
	private getKey(key: K) {
		return JSON.stringify({
			label: this.label,
			key: key,
		})
	}
	private getOriginalKey(key: string): K {
		return JSON.parse(key).key
	}
	private undefinedValue(): any {
		return undefined
	}
	public async get(key: K) {
		return new Promise<T>(async (resolve, reject) => {
			try {
				if (!key) {
					resolve(this.undefinedValue())
					return
				}
				switch (this.storage) {
					case 'LocalStorage':
						resolve(this.getSync(key))
						break
					case 'IndexedDB':
						const k = this.getKey(key)
						WebStorage.model
							.Find({
								label: {
									$value: this.label,
								},
								key: {
									$value: k,
								},
							})
							.Result()
							.then(async (v: any) => {
								if (!v.length) {
									resolve(this.undefinedValue())
									return
								}
								const vObj: Value<T> = JSON.parse(v[0].data)
								// const options = JSON.parse(v[0].options).v
								if (!vObj) {
									return this.undefinedValue()
								}
								if (vObj.expiration === -1) {
									this.map[k] = vObj
									resolve(vObj.value)
									return
								} else {
									if (vObj.expiration >= new Date().getTime()) {
										this.map[k] = vObj
										resolve(vObj.value)
										return
									} else {
										this.delete(key)
										resolve(this.undefinedValue())
										return
									}
								}
							})
							.catch((err) => {
								console.log(err)
								resolve(this.undefinedValue())
							})
						break
					// throw 'IndexedDB does not support synchronous functions'
					case 'ElectronNodeFsStorage':
						const v = await WebStorage.electronNodeFsStorageMethods.request({
							type: 'get',
							key: String(key),
							label: this.label,
						})
						resolve(v)
						break

					default:
						break
				}
			} catch (error) {
				console.error(error)
				return reject(this.undefinedValue())
			}
		})
	}
	public async getAll() {
		return new Promise<
			{
				key: K
				value: T
			}[]
		>(async (resolve, reject) => {
			try {
				switch (this.storage) {
					case 'LocalStorage':
						resolve([])
						throw 'LocalStorage does not support functions'
						break
					case 'IndexedDB':
						WebStorage.model
							.Find({
								label: {
									$value: this.label,
								},
							})
							.Result()
							.then((res) => {
								const list = res?.map((v) => {
									const vObj: Value<T> = JSON.parse(v.data)
									this.map[v.key] = vObj
									return {
										key: this.getOriginalKey(v.key),
										value: vObj.value,
									}
								})
								resolve(list)
							})
							.catch((err) => {
								console.log(err)
								resolve(this.undefinedValue())
							})
						// throw 'IndexedDB does not support synchronous functions'
						break
					case 'ElectronNodeFsStorage':
						const res = await WebStorage.electronNodeFsStorageMethods
							.request({
								type: 'getAll',
								label: this.label,
							})
							.then()
						resolve(res || [])
						break
					default:
						break
				}
			} catch (error) {
				console.error(error)
				return reject(this.undefinedValue())
			}
		})
	}
	public getAllSync(): {
		key: K
		value: T
	}[] {
		try {
			switch (this.storage) {
				case 'LocalStorage':
					console.error('LocalStorage does not support functions')
					return []
				case 'IndexedDB':
					const keys = Object.keys(this.map)
					if (keys.length) {
						return keys.map((k) => {
							return {
								key: this.getOriginalKey(k),
								value: this.map[k].value,
							}
						})
					}
					this.getAll()
						.then()
						.catch((err) => {
							console.error(err)
						})
					return []

				default:
					break
			}
		} catch (error) {
			console.error(error)
			return []
		}
		return []
	}
	public getSync(key: K): T {
		if (!key) {
			return this.undefinedValue()
		}
		const k = this.getKey(key)
		switch (this.storage) {
			case 'LocalStorage':
				try {
					if (this.map[k]) {
						const vObj = this.map[k]
						if (vObj.expiration === -1) {
							this.map[k] = vObj
							return vObj.value
						} else {
							if (vObj.expiration >= new Date().getTime()) {
								this.map[k] = vObj
								return vObj.value
							} else {
								this.delete(key)
								return this.undefinedValue()
							}
						}
					}
					const v = localStorage.getItem(k)
					if (!v) {
						return this.undefinedValue()
					}
					const vObj: Value<T> = JSON.parse(v)
					if (!vObj?.value) {
						return this.undefinedValue()
					}
					if (vObj.expiration === -1) {
						this.map[k] = vObj
						return vObj.value
					} else {
						if (vObj.expiration >= new Date().getTime()) {
							this.map[k] = vObj
							return vObj.value
						} else {
							this.delete(key)
							return this.undefinedValue()
						}
					}
				} catch (error) {
					console.error(error)
					return this.undefinedValue()
				}
				break
			case 'IndexedDB':
				if (this.map[k]) {
					if (this.map[k].expiration === -1) {
						return this.map[k].value
					} else {
						if (this.map[k].expiration >= new Date().getTime()) {
							return this.map[k].value
						} else {
							this.delete(key)
							return this.undefinedValue()
						}
					}
				} else {
					this.get(key).then()
					return this.undefinedValue()
				}
			case 'ElectronNodeFsStorage':
				console.error(
					'ElectronNodeFsStorage does not support synchronous functions'
				)
				break
			// throw 'IndexedDB does not support synchronous functions'

			default:
				break
		}
		return this.undefinedValue()
	}
	public async getAndSet(key: K, func: (value: T) => Promise<T>) {
		const v = await this.get(key)
		const nv = await func(v)
		await this.set(key, nv)
		return nv
	}
	// expiration(s)
	public set(key: K, value: T, expiration: number = 0) {
		return new Promise<boolean>(async (resolve, reject) => {
			try {
				if (!key) return resolve(false)
				switch (this.storage) {
					case 'ElectronNodeFsStorage':
						const v = await WebStorage.electronNodeFsStorageMethods.request({
							type: 'set',
							key: String(key),
							label: this.label,
							value: value,
							expiration,
						})
						resolve(v)
						break
					case 'LocalStorage':
						resolve(this.setSync(key, value, expiration))
						break
					case 'IndexedDB':
						const k = this.getKey(key)
						const getValue = await this.get(key)
						const vObj = this.getValue(value, expiration * 1000)
						if (typeof key === 'string') {
						}
						if (!getValue) {
							new WebStorage.model({
								key: k,
								data: vObj.toString(),
								options: JSON.stringify({
									// v: {
									// 	expiration: expiration ? expiration * 1000 : -1,
									// },
								}),
								label: this.label,
							})
								.Save()
								.then((res) => {
									this.map[k] = vObj.toJson()
									resolve(true)
								})
								.catch((err: any) => {
									console.log(err)
									resolve(false)
								})
						} else {
							WebStorage.model
								.Update(
									{
										label: {
											$value: this.label,
										},
										key: {
											$value: k,
										},
									},
									{
										data: vObj.toString(),
										options: JSON.stringify({
											// v: {
											// 	expiration: expiration ? expiration * 1000 : -1,
											// },
										}),
									}
								)
								.then((res: any) => {
									this.map[k] = vObj.toJson()
									resolve(true)
								})
								.catch((err: any) => {
									resolve(false)
								})
						}
						break
					// throw 'IndexedDB does not support synchronous functions'

					default:
						break
				}
			} catch (error) {
				console.error(error)
				return reject(this.undefinedValue())
			}
		})
	}
	public setSync(key: K, value: T, expiration: number = 0): boolean {
		if (!key) return false
		const k = this.getKey(key)
		switch (this.storage) {
			case 'LocalStorage':
				const vObj = this.getValue(value, expiration * 1000)

				localStorage.setItem(k, vObj.toString())
				this.map[k] = vObj.toJson()

				this.keys = this.keys.filter((v) => {
					return v != key
				})
				this.keys.push(key)

				this.updateKeys()

				break
			case 'IndexedDB':
				this.set(key, value, expiration).then()
				// throw 'IndexedDB does not support synchronous functions'

				break
			case 'ElectronNodeFsStorage':
				WebStorage.electronNodeFsStorageMethods
					.request({
						type: 'set',
						key: String(key),
						label: this.label,
						value: value,
						expiration,
					})
					.then()
				break
			default:
				break
		}
		return true
	}
	public async delete(key: K) {
		if (!key) return
		const k = this.getKey(key)

		delete this.map[k]
		switch (this.storage) {
			case 'LocalStorage':
				localStorage.removeItem(k)
				delete this.map[k]
				this.keys = this.keys.filter((v) => {
					return v != key
				})

				this.updateKeys()
				// WebStorage.storageKeys.getAndSet('nyanyajskeys', (v) => {
				// 	!v && (v = [])
				// 	v = v.filter((item) => {
				// 		if (this.label === item.label) {
				// 			if (k === item.key) {
				// 				return false
				// 			}
				// 			return true
				// 		} else {
				// 			return true
				// 		}
				// 	})
				// 	return v
				// })
				break
			case 'IndexedDB':
				await WebStorage.model.Delete({
					label: {
						$value: this.label,
					},
					key: {
						$value: k,
					},
				})

				delete this.map[k]
				break
			case 'ElectronNodeFsStorage':
				await WebStorage.electronNodeFsStorageMethods.request({
					type: 'delete',
					key: String(key),
					label: this.label,
				})
				break
			// throw 'IndexedDB does not support synchronous functions'

			default:
				break
		}
	}
	public deleteAll() {
		this.map = {}
		switch (this.storage) {
			case 'LocalStorage':
				this.keys.forEach((v) => {
					const k = this.getKey(v)
					localStorage.removeItem(k)
				})
				this.map = {}
				this.keys = []
				this.updateKeys()
				// let keys = WebStorage.storageKeys.getSync('nyanyajskeys') || []
				// keys.forEach((item) => {
				// 	localStorage.removeItem(item.key)
				// })

				// WebStorage.storageKeys.getAndSet('nyanyajskeys', (v) => {
				// 	!v && (v = [])
				// 	v = v.filter((item) => {
				// 		if (this.label === item.label) {
				// 			return false
				// 		} else {
				// 			return true
				// 		}
				// 	})
				// 	return v
				// })
				break
			case 'IndexedDB':
				WebStorage.model
					.Delete({
						label: {
							$value: this.label,
						},
					})
					.then((v: any) => {
						this.map = {}
					})
					.catch((err: any) => {
						throw err
					})
				break
			case 'ElectronNodeFsStorage':
				WebStorage.electronNodeFsStorageMethods
					.request({
						type: 'deleteAll',
						label: this.label,
					})
					.then()
				break
			// throw 'IndexedDB does not support synchronous functions'

			default:
				break
		}
	}
}
if (!WebStorage.storageKeys) {
	WebStorage.storageKeys = new WebStorage<string, string[]>({
		storage: 'IndexedDB',
		baseLabel: 'storageKeys',
	})
}
WebStorage.electronNodeFsStorageInit()
// console.log('WebStorage.storageKeys', WebStorage.storageKeys)

// WebStorage.storageKeys.getAll().then((v) => {
// 	console.log('v', v)
// })
export default WebStorage
