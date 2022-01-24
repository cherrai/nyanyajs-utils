import md5 from 'blueimp-md5'

export const random = (min: number, max: number) => {
	var newMin = min || 0
	var newMax = max || 10
	return min !== undefined && max !== undefined
		? Math.floor(Math.random() * (newMax - newMin) + newMin)
		: Math.floor(Math.random() * 10)
}

export const getRandomNum = (digits: number) => {
	let num = String(random(1, 10))
	for (let i = 1; i < digits; i++) {
		num += String(random(0, 10))
	}
	return num
}

export const getRandomKey = () => {
	return md5(getRandomNum(16) + 'nyanya')
}
