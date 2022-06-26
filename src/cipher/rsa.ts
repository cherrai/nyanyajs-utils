import { KEYUTIL, KJUR, b64tohex, hextob64 } from 'jsrsasign'
import CryptoJS from 'crypto-js'

export const getRsaKey = () => {
	return new Promise<{
		privateKey: string
		publicKey: string
	}>((resolve, reject) => {
		try {
			const rsaKeypair = KEYUTIL.generateKeypair('RSA', 2048)
			const privateKey = KEYUTIL.getPEM(rsaKeypair.prvKeyObj, 'PKCS8PRV')
			const publicKey = KEYUTIL.getPEM(rsaKeypair.pubKeyObj)

			resolve({
				privateKey,
				publicKey,
			})
		} catch (error) {
			reject(error)
		}
	})
}
export const getSign = (
	privatekey: string,
	str: string,
	alg: string = 'SHA256withRSA'
) => {
	const rsa = KEYUTIL.getKey(privatekey)
	const sig = new KJUR.crypto.Signature({ alg: alg })
	sig.init(rsa)
	sig.updateString(str)
	// var sign = hextob64(sig.sign())
	return sig.sign()
}
export const encrypt = (pk: string, src: string, algName: string = 'RSA') => {
	const pub = KEYUTIL.getKey(pk)
	const encryptFunc: any = KJUR.crypto.Cipher.encrypt
	const value = encryptFunc(src, pub, algName)
	// console.log(UTF8.stringify(UTF8.parse(value)))
	return value
}
export const decrypt = (priK: string, enc: string) => {
	var prv = KEYUTIL.getKey(priK)
	const decryptFunc: any = KJUR.crypto.Cipher.decrypt
	const value = decryptFunc(enc, prv)
	return value
}

export const verifySign = (
	data: string,
	publicKey: string,
	sign: string,
	alg: string = 'SHA256withRSA'
) => {
	const sig2 = new KJUR.crypto.Signature({
		alg: alg,
	})
	sig2.init(publicKey)
	sig2.updateString(data)
	const isValid = sig2.verify(sign)
	// const isValid = sig2.verify(b64tohex(sign))
	return isValid
}

export default {
	getRsaKey,
	getSign,
	encrypt,
	decrypt,
	verifySign,
}
