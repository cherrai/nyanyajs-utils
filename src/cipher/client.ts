import RSA from './rsa'
import DiffieHellman from './diffie-hellman'
import md5 from 'blueimp-md5'

import { WebStorage } from '../webStorage'

export class Encryption {
	rsa = {
		delayDays: 10,
		remote: {
			publicKey: '',
		},
		local: {
			privateKey: '',
			publicKey: '',
			sign: '',
		},
	}
	aes = {
		key: '',
		userKey: '',
	}
	dh?: DiffieHellman
	ws: WebStorage
	constructor(params: { rsaDelayDays: number; label: string }) {
		// console.time('开始签名')
		this.ws = new WebStorage<string>({
			storage: 'LocalStorage',
			baseLabel: 'nyanya-js-cipher' + params.label,
		})
		if (params?.rsaDelayDays) {
			this.rsa.delayDays = params.rsaDelayDays
		}
		this.InitRsa()
		// console.timeEnd('开始签名')
	}
	async InitRsa() {
		// 改为ws 存储
		let getPrivateKey = this.ws.getSync('rsakey_privateKey') || ''
		let getPublicKey = this.ws.getSync('rsakey_publicKey') || ''
		let sign = ''
		if (!getPrivateKey || !getPublicKey) {
			const { privateKey, publicKey } = await RSA.getRsaKey()
			getPrivateKey = privateKey
			getPublicKey = publicKey
			await this.ws.set(
				'rsakey_privateKey',
				getPrivateKey,
				this.rsa.delayDays * 3600 * 24
			)
			await this.ws.set(
				'rsakey_publicKey',
				publicKey,
				this.rsa.delayDays * 3600 * 24
			)
		} else {
			// const enc = getPublicKey.split('eudjshehdjf')[0]
			// let getPublicKeyTemp = getPublicKey.split('eudjshehdjf')[1]
			// getPublicKey = decrypt(getPrivateKey, enc) + getPublicKeyTemp
		}
		sign = RSA.getSign(getPrivateKey, getPublicKey)
		// decrypt(
		//   getPrivateKey,
		// )
		this.rsa.local.privateKey = getPrivateKey
		this.rsa.local.publicKey = getPublicKey
		this.rsa.local.sign = sign
	}
	setRsaRemotePublicKey(pbk: string) {
		this.rsa.remote.publicKey = pbk
	}
	setAesKey(secretKey: string, randomKey: string, userKey: string) {
		this.aes.key = md5(secretKey + randomKey).toUpperCase()
		this.aes.userKey = userKey
	}
	clear() {
		this.setAesKey('', '', '')
		this.rsa.remote.publicKey = ''
		this.rsa.local.publicKey = ''
		this.rsa.local.privateKey = ''
		this.rsa.local.sign = ''
	}
}

export default Encryption
