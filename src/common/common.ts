const deco = (v: any, count: number, maximumDepth: number) => {
	if (count >= maximumDepth) {
		return v
	}
	if (typeof v === 'object') {
		if (!v) return v
		if (v instanceof Array) {
			let obj = v.map((sv) => {
				return deco(sv, count + 1, maximumDepth)
			})
			return obj
		}
		let obj = {}
		Object.keys(v).forEach((k) => {
			obj[k] = deco(v[k], count + 1, maximumDepth)
		})
		return obj
	}
	return v
}
export const deepCopy = (v: any, maximumDepth: number = 5) => {
	return deco(v, 0, maximumDepth)
}
