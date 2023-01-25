export const compareUnicodeOrder = (a: string, b: string, i = 0): number => {
	let ai = a.charCodeAt(i)
	let bi = b.charCodeAt(i)
	if (ai < bi) {
		return 1
	}
	if (ai === bi) {
		i++
		if (a.length - 1 < i || b.length - 1 < i) {
			return 1
		}
		return compareUnicodeOrder(a, b, i)
	}
	return -1
}

export const getInitials = (a: string, defaultValue = '#') => {
	let z = a.substring(0, 1)
	let c = z.charCodeAt(0)
	if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
		return z
	}
	return defaultValue
}
