import RSA from './rsa'
import DiffieHellman from './diffie-hellman'
import md5 from 'blueimp-md5'

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
	constructor(params?: { rsaDelayDays: number }) {
		console.time('开始签名')
		if (params?.rsaDelayDays) {
			this.rsa.delayDays = params.rsaDelayDays
		}
		this.InitRsa()
		console.timeEnd('开始签名')
	}
	InitRsa() {
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
			const { privateKey, publicKey } = RSA.getRsaKey()
			getPrivateKey = privateKey
			getPublicKey = publicKey
			localStorage.setItem(
				'rsakey_delay_timestamp',
				String(
					Math.floor(new Date().getTime() / 1000) +
						this.rsa.delayDays * 3600 * 24
				)
			)
			localStorage.setItem('rsakey_privateKey', getPrivateKey)
			// localStorage.setItem(
			// 	'rsakey_publicKey',
			// 	encrypt(getPublicKey, getPublicKey.substring(0, 50)) +
			// 		'eudjshehdjf' +
			// 		getPublicKey.substring(50, getPublicKey.length - 1)
			// )
			localStorage.setItem('rsakey_publicKey', publicKey)

			// console.log(getPrivateKey)
			// console.log(getPrivateKey === localStorage.getItem('rsakey_privateKey'))
			// console.log(encodeURIComponent(getPublicKey))
			// console.log(decodeURIComponent(encodeURIComponent(getPublicKey)))
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
