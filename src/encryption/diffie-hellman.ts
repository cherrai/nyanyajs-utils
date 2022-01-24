import { random, getRandomNum } from './commmon'
const BigNumber = require('big-number')

BigNumber.prototype.clean = function () {
	// used to make the value of BigNumber()'s more eye friendly
	var total = ''
	for (var i = 0; i < this.number.length; i++) {
		total += this.number[this.number.length - (i + 1)]
	}
	return total
}

type publicKey = {
	external?: string
	internal?: string
}

export class DiffieHellman {
	prime: string = ''
	base: string = ''
	randNum: number = 0
	// 服务端
	publicKey: publicKey = {
		external: '',
		internal: '',
	}
	key: string = ''
	constructor(options?: {
		prime?: string
		base?: string
		publicKey?: publicKey
		randNum?: number
	}) {
		if (options) {
			if (options?.prime && options?.base) {
				this.prime = options.prime
				this.base = options.base
			}
			if (options?.publicKey?.external) {
				this.publicKey.external = options.publicKey.external
			}
			if (options?.publicKey?.internal) {
				this.publicKey.internal = options.publicKey.internal
			}
			if (options?.randNum) {
				this.randNum = options.randNum
			}
		} else {
			this.prime = getRandomNum(16)
			this.base = getRandomNum(16)
			this.randNum = Number(getRandomNum(2))
		}

		if (!this.randNum) {
			this.randNum = Number(getRandomNum(2))
		}
		if (!this.publicKey.internal) {
			this.publicKey.internal = new BigNumber(this.base)
				.pow(this.randNum)
				.mod(this.prime)
				.clean()
		}
	}

	/**
	 * 如果是Clint端自己生成Key则不需要传publicKey
	 * 如果是Server端生成，则需要传key
	 * @param publicKey
	 * @returns
	 */
	generateSecretKey(publicKey?: string) {
		if (publicKey) {
			this.publicKey.external = publicKey
			this.key = BigNumber(Number(publicKey))
				.pow(this.randNum)
				.mod(this.prime)
				.clean()
			return this.key
		} else {
			this.key = BigNumber(Number(this.publicKey.external))
				.pow(this.randNum)
				.mod(this.prime)
				.clean()
			return this.key
		}
	}
}

export default DiffieHellman
