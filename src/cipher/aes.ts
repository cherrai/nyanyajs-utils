import CryptoJS from 'crypto-js'

import AES from 'crypto-js/aes' //CFB模式
import CFB from 'crypto-js/mode-cfb' //CFB模式
import UTF8 from 'crypto-js/enc-utf8'
import Nopadding from 'crypto-js/pad-nopadding' //这里使输出HEX格式
// 加密函数
// IV需要协商统一，统一由秘钥+每次请求的requestTime时间戳组成吧

export const decrypt = (data: any, key: string, iv?: string) => {
	try {
		// var base64data = CryptoJS.enc.Base64.parse(data)
		// var cipherParams = CryptoJS.lib.CipherParams.create({
		// 	ciphertext: UTF8.parse(data),
		// })

		var reb64 = CryptoJS.enc.Hex.parse(data)
		var bytes = reb64.toString(CryptoJS.enc.Base64)
		// const newData = UTF8.parse(data)
		const newKey = UTF8.parse(key)
		const newIv = UTF8.parse(iv || key)
		// var encrypted = new CryptoJS.lib.WordArray.init(base64data.words.slice(4))
		// 加密
		// console.log(CryptoJS.format.Hex.parse(data))
		// console.log(CryptoJS.format.Hex.parse(data))

		var ciphertext = AES.decrypt(bytes, newKey, {
			iv: newIv,
			mode: CFB,
			padding: Nopadding,
		})
		// console.log('ciphertext', ciphertext)
		// console.log('ciphertext', ciphertext.toString())
		// console.log('ciphertext', ciphertext)
		// console.log('ciphertext', String(ciphertext))
		// console.log('ciphertext', ciphertext.toString(CryptoJS.enc.Hex))
		// console.log('ciphertext', ciphertext.toString(CryptoJS.enc.Utf8))
		// console.log('ciphertext', UTF8.stringify(ciphertext))
		return UTF8.stringify(ciphertext)
	} catch (error) {
		return ''
	}
}
export const encrypt = (data: any, key: string, iv?: string) => {
	const newData = UTF8.parse(JSON.stringify(data))
	const newKey = UTF8.parse(key)
	const newIv = UTF8.parse(iv || key)
	// 加密
	var ciphertext = AES.encrypt(newData, newKey, {
		iv: newIv,
		mode: CFB,
		padding: Nopadding,
	})
	// console.log('ciphertext', ciphertext, CryptoJS)
	// console.log('result', result)
	// return ciphertext
	return {
		ciphertext,
		value: ciphertext.ciphertext.toString(CryptoJS.enc.Hex), //这里返回的是HEX格式
	}
}
export default {
	decrypt,
	encrypt,
}

// decrypt(data: any, key: string, iv: string) {
// 	// var base64data = CryptoJS.enc.Base64.parse(data)
// 	const newData = UTF8.parse(data)
// 	const newKey = UTF8.parse(key)
// 	const newIv = UTF8.parse(iv)
// 	// var encrypted = new CryptoJS.lib.WordArray.init(base64data.words.slice(4))
// 	// 加密
// 	// console.log(CryptoJS.format.Hex.parse(data))
// 	// console.log(CryptoJS.format.Hex.parse(data))
// 	var ciphertext = AES.decrypt(data, newKey, {
// 		iv: newIv,
// 		mode: CFB,
// 		padding: Nopadding,
// 	})
// 	// console.log('ciphertext', ciphertext)
// 	// console.log('ciphertext', ciphertext.toString())
// 	// console.log('ciphertext', UTF8.stringify(ciphertext))
// 	return UTF8.stringify(ciphertext)
// }
// encrypt(data: any, key: string, iv: string) {
// 	const newData = UTF8.parse(JSON.stringify(data))
// 	const newKey = UTF8.parse(key)
// 	const newIv = UTF8.parse(iv)
// 	// 加密
// 	var ciphertext = AES.encrypt(newData, newKey, {
// 		iv: newIv,
// 		mode: CFB,
// 		padding: Nopadding,
// 	})
// 	// console.log('ciphertext', ciphertext)
// 	// console.log('result', result)
// 	// return ciphertext
// 	return {
// 		ciphertext,
// 		value: ciphertext.ciphertext.toString(), //这里返回的是HEX格式
// 	}
// }

// decrypt(data: any, key: string, iv: string) {
// 	// var base64data = CryptoJS.enc.Base64.parse(data)
// 	const newData = UTF8.parse(data)
// 	const newKey = UTF8.parse(key)
// 	const newIv = UTF8.parse(iv)
// 	// var encrypted = new CryptoJS.lib.WordArray.init(base64data.words.slice(4))
// 	// 加密
// 	// console.log(CryptoJS.format.Hex.parse(data))
// 	// console.log(CryptoJS.format.Hex.parse(data))
// 	var ciphertext = AES.decrypt(data, newKey, {
// 		iv: newIv,
// 		mode: CFB,
// 		padding: Nopadding,
// 	})
// 	// console.log('ciphertext', ciphertext)
// 	// console.log('ciphertext', ciphertext.toString())
// 	// console.log('ciphertext', UTF8.stringify(ciphertext))
// 	return UTF8.stringify(ciphertext)
// }
