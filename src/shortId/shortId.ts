import { randomNum } from '../nnumber'

export const getRandomStringInSpecifiedRange = (rs: string, digits: number) => {
	let rn = randomNum(0, rs.length - 1)

	let str = rs.slice(rn, rn + 1)

	for (let i = 0; i < digits - 1; i++) {
		rn = randomNum(0, rs.length - 1)
		str += rs.slice(rn, rn + 1)
	}
	return str
}
export const getShortId = (digits: number) => {
	let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
	let number = '0123456789'
	let s = alphabet + number
	let rn = randomNum(0, alphabet.length - 1)
	let str = alphabet.slice(rn, rn + 1)
	for (let i = 0; i < digits - 1; i++) {
		rn = randomNum(0, s.length - 1)
		str += s.slice(rn, rn + 1)
	}
	// 检测
	return str
}
