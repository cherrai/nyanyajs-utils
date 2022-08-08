import path from 'path'
import fs from 'fs'
// const path = require("path")
// const fs = require("fs")

import { Value } from '.'
import md5 from 'blueimp-md5'

export class NodeFsStorage<T = any> {
	static storages: {
		[label: string]: NodeFsStorage
	} = {}
	static baseRootDir = ''
	private label: string = ''
	private labelEnStr: string = ''
	private baseLabel: string = ''
	private cacheRootDir: string = ''
	private encryption?: {
		enable: boolean
		key?: string
	} = {
		enable: false,
	}
	constructor(options: {
		label: string
		cacheRootDir: string
		// encryption?: {
		// 	enable: boolean
		// 	key?: string
		// }
	}) {
		options.label && (this.label = options.label)
		// options.encryption && (this.encryption = options.encryption)
		this.setLabel(options.label)
		this.setCacheRootDir(options.cacheRootDir)
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
		NodeFsStorage.storages[this.label] = this
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
	private getKey(key?: string) {
		let l = this.label
		let k = String(key)
		if (this.encryption.enable) {
			l = md5(l + this.encryption.key)
			k = k + this.encryption.key
		}
		return {
			label: l,
			key: k,
			dir: path.join(this.cacheRootDir, '/' + l),
		}
	}
	public set(key: string, value: T, expiration?: number) {
		return new Promise<boolean>(async (resolve, reject) => {
			try {
				if (!key) {
					reject('Key does not exist.')
					return
				}
				let k = this.getKey(key)
				let v = this.getValue(value, expiration)
				let fileDir = path.join(k.dir, '/' + k.key)
				if (fs.existsSync(fileDir)) {
					fs.writeFileSync(fileDir, v.toString())
					resolve(true)
					return
				}
				NodeFsStorage.mkdirsSync(k.dir)
				// { flag: 'a' } // 追加
				fs.writeFileSync(fileDir, v.toString())
				resolve(true)
			} catch (error) {
				console.error(error)
				return reject(undefined)
			}
		})
	}
	public async get(key: string) {
		return new Promise<T>(async (resolve, reject) => {
			try {
				if (!key) {
					resolve(undefined)
					return
				}
				let k = this.getKey(key)
				// let v = this.getValue(value, expiration)
				let fileDir = path.join(k.dir, '/' + k.key)

				if (!fs.existsSync(fileDir)) {
					resolve(undefined)
					return
				}
				NodeFsStorage.mkdirsSync(k.dir)
				// { flag: 'a' } // 追加
				const v = fs.readFileSync(fileDir)
				if (!v.toString()) {
					resolve(undefined)
					return
				}
				const vObj: Value<T> = JSON.parse(v.toString())
				if (!vObj) {
					return undefined
				}
				if (vObj.expiration === -1) {
					resolve(vObj.value)
					return
				} else {
					if (vObj.expiration >= new Date().getTime()) {
						resolve(vObj.value)
						return
					} else {
						// this.delete(key)
						resolve(undefined)
						return
					}
				}
			} catch (error) {
				console.error(error)
				return reject(undefined)
			}
		})
	}
	public async getAndSet(key: string, func: (value: T) => Promise<T>) {
		const v = await this.get(key)
		const nv = await func(v)
		await this.set(key, nv)
		return nv
	}
	public async getAll() {
		return new Promise<
			{
				key: string
				value: T
			}[]
		>(async (resolve, reject) => {
			let k = this.getKey()

			if (!fs.existsSync(k.dir)) {
				resolve(undefined)
				return
			}
			let readDir = fs.readdirSync(k.dir)
			if (!readDir.length) return resolve([])
			let values: {
				key: string
				value: T
			}[] = readDir
				.map((key) => {
					const v = fs.readFileSync(path.join(k.dir, './' + key))
					if (!v.toString()) {
						resolve(undefined)
						return
					}
					const vObj: Value<T> = JSON.parse(v.toString())
					if (!vObj) {
						return undefined
					}
					if (vObj.expiration === -1) {
						return {
							key: key,
							value: vObj.value,
						}
					}
					if (vObj.expiration >= new Date().getTime()) {
						return {
							key: key,
							value: vObj.value,
						}
					}
					fs.unlinkSync(path.join(k.dir, './' + key))
					return {
						key: key,
						value: undefined,
					}
				})
				.filter((v) => {
					return !!v.value
				})

			resolve(values)
			try {
			} catch (error) {
				console.error(error)
				return reject(undefined)
			}
		})
	}
	public async delete(key: string) {
		if (!key) return
		let k = this.getKey(key)
		// let v = this.getValue(value, expiration)
		let fileDir = path.join(k.dir, '/' + k.key)

		if (!fs.existsSync(fileDir)) {
			return
		}
		fs.unlinkSync(path.join(k.dir, '/' + k.key))
	}
	public deleteAll() {
		let k = this.getKey()
		if (!fs.existsSync(k.dir)) {
			return
		}
		let readDir = fs.readdirSync(k.dir)
		if (!readDir.length) return
		readDir.forEach((key) => {
			const v = fs.readFileSync(path.join(k.dir, './' + key))
			if (!v.toString()) {
				return
			}
			fs.unlinkSync(path.join(k.dir, './' + key))
		})
	}
}
