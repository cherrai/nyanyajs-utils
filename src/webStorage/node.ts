import path from 'path'
import fs from 'fs'

import { Value } from '.'
import md5 from 'blueimp-md5'

export class NodeFsStorage<K = string, T = any> {
	private label: string = ''
	private labelEnStr: string = ''
	private baseLabel: string = ''
	private cacheRootDir: string = ''
	private encryption?: {
		enable: boolean
		key?: string
	}
	constructor(options: {
		baseLabel: string
		cacheRootDir: string
		encryption?: {
			enable: boolean
			key?: string
		}
	}) {
		console.log(options)
		options.baseLabel && (this.baseLabel = options.baseLabel)
		options.encryption && (this.encryption = options.encryption)
		this.setLabel(options.baseLabel)
		this.setCacheRootDir(options.cacheRootDir)
		console.log(this.label)
		console.log(this.baseLabel)
		console.log(this.cacheRootDir)
	}

	static mkdirsSync(dirname: string) {
		if (fs.existsSync(dirname)) {
			return true
		} else {
			if (NodeFsStorage.mkdirsSync(path.dirname(dirname))) {
				fs.mkdirSync(dirname)
				return true
			}
		}
	}

	public setLabel(label: string) {
		this.label = label
		if (this.encryption.enable) {
			this.labelEnStr = md5(this.label + this.encryption.key)
		}
	}
	public setCacheRootDir(cacheRootDir: string) {
		this.cacheRootDir = cacheRootDir
		NodeFsStorage.mkdirsSync(this.cacheRootDir)
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
	public set(key: K, value: T, expiration?: number) {
		return new Promise<boolean>(async (resolve, reject) => {
			try {
				console.log('set', key, value)
				console.log('getKey', this.getKey(key))

				let k = this.getKey(key)
				let dir = this.label
				if (this.encryption.enable) {
					k = md5(k + this.encryption.key)
					dir = this.labelEnStr
				} else {
					k = key.toString()
				}
				console.log(path.join(this.cacheRootDir, '/' + dir + '/' + k))
				NodeFsStorage.mkdirsSync(
					path.join(this.cacheRootDir, '/' + dir + '/' + k)
				)
				return
				// fs.writeFile(this.cacheRootDir+"/"+, 'HelloWorld', { flag: 'a' }, function (err) {
				// 	if (err) {
				// 		throw err
				// 	}

				// 	console.log('Hello.')

				// 	// 写入成功后读取测试
				// 	fs.readFile('./try4.txt', 'utf-8', function (err, data) {
				// 		if (err) {
				// 			throw err
				// 		}
				// 		console.log(data)
				// 	})
				// })
			} catch (error) {
				console.error(error)
				return reject(undefined)
			}
		})
	}
	public async get(key: K) {
		return new Promise<T>(async (resolve, reject) => {
			try {
				if (!key) {
					resolve(undefined)
					return
				}
			} catch (error) {
				console.error(error)
				return reject(undefined)
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
			} catch (error) {
				console.error(error)
				return reject(undefined)
			}
		})
	}
	public async delete(key: K) {
		if (!key) return
	}
	public deleteAll() {}
}
