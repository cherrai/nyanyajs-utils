import {
	ModpBitLen,
	getModpGroupInfo,
	generateIndividualKey,
	getSharedKey,
	ModpGroupId,
} from 'dhkea-js'

export interface DHKeaOptions {
	enableCache?: boolean
	bitLen?: ModpBitLen
}

export class DHKea {
	private enableCache: boolean = false
	public privateKey: bigint
	public publicKey: bigint
	private bitLen?: ModpBitLen = 2048
	constructor(options?: DHKeaOptions) {
		if (options?.bitLen) {
			this.bitLen = options?.bitLen
		}
		if (options?.enableCache) {
			this.enableCache = options?.enableCache
		}
		this.generateIndividualKey()
	}
	private generateIndividualKey() {
		const ik = generateIndividualKey(this.bitLen)
		this.privateKey = ik.privateKey
		this.publicKey = ik.publicKey
		return ik.publicKey
	}
	public getSharedKey(theirPublicKey: bigint) {
		const sharedKey = getSharedKey(this.privateKey, theirPublicKey, this.bitLen)
		return sharedKey
	}
}

export {
	ModpBitLen,
	getModpGroupInfo,
	generateIndividualKey,
	getSharedKey,
	ModpGroupId,
}

export default {
	DHKea,
	getModpGroupInfo,
	generateIndividualKey,
	getSharedKey,
}
