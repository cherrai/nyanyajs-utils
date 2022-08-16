import CryptoJS from 'crypto-js'

export const getHash = (result: string | ArrayBuffer) => {
	const r: any = result
	const wordArray = CryptoJS.lib.WordArray.create(r)
	const hash = CryptoJS.SHA256(wordArray).toString()
	return hash
}
export const file = {
	getHash,
}
