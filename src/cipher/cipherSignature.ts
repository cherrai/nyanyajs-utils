import RSA from './rsa'
import { DHKea, DHKeaOptions } from './dhkea'
import md5 from 'blueimp-md5'
import * as nyanyalog from 'nyanyajs-log'

// deadline => timestamp(s)
export class CipherSignature {
	type: 'nodejs' | 'browser' = 'browser'
	rsa = {
		// browser only.
		deadline: 21 * 3600 * 24,
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
		aesKey: '',
		userKey: '',
	}
	dhkea?: DHKea
	constructor(params?: { deadline?: number }) {
		nyanyalog.time('签名')
		if (typeof window === 'undefined') {
			this.type = 'nodejs'
		}
		if (params?.deadline) {
			this.rsa.deadline = params.deadline
		}
		this.initRsa()
		nyanyalog.timeEnd('签名')
	}
	private async initRsa() {
		switch (this.type) {
			case 'nodejs':
				break
			case 'browser':
				let getPrivateKey = localStorage.getItem('rsakey_privateKey') || ''
				let getPublicKey = localStorage.getItem('rsakey_publicKey') || ''
				let delayTimestamp = localStorage.getItem('rsakey_delay_timestamp')
				let sign = ''
				if (
					Number(delayTimestamp) < Math.floor(new Date().getTime() / 1000) ||
					!getPrivateKey ||
					!getPublicKey
				) {
					localStorage.removeItem('rsakey_delay_timestamp')
					localStorage.removeItem('rsakey_privateKey')
					localStorage.removeItem('rsakey_publicKey')
					const { privateKey, publicKey } = await RSA.getRsaKey()
					getPrivateKey = privateKey
					getPublicKey = publicKey
					localStorage.setItem(
						'rsakey_delay_timestamp',
						String(Math.floor(new Date().getTime() / 1000) + this.rsa.deadline)
					)
					localStorage.setItem('rsakey_privateKey', getPrivateKey)
					localStorage.setItem('rsakey_publicKey', publicKey)
				} else {
				}
				sign = RSA.getSign(getPrivateKey, getPublicKey)
				// decrypt(
				//   getPrivateKey,
				// )
				this.rsa.local.privateKey = getPrivateKey
				this.rsa.local.publicKey = getPublicKey
				this.rsa.local.sign = sign

				break

			default:
				break
		}
	}
	setRemoteRsaPublicKey(pbk: string) {
		this.rsa.remote.publicKey = pbk
	}
	createDHKea(options?: DHKeaOptions) {
		this.dhkea = new DHKea(options)
		return this.dhkea
	}
	setAesKey({
		secretKey,
		randomStr,
		userKey,
	}: {
		secretKey: string
		randomStr: string
		userKey: string
	}) {
		this.aes.aesKey = md5(secretKey + randomStr).toUpperCase()
		this.aes.userKey = userKey
	}
	clear() {
		this.rsa.remote.publicKey = ''
		this.rsa.local.publicKey = ''
		this.rsa.local.privateKey = ''
		this.rsa.local.sign = ''
		this.aes.aesKey = ''
		this.aes.userKey = ''
	}
}

export default CipherSignature
