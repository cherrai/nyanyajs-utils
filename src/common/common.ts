const deco = (v: any, count: number, maximumDepth: number) => {
	if (count >= maximumDepth) {
		return v
	}
	if (typeof v === 'object') {
		if (!v) return v
		if (v?.length != undefined) {
			if (v instanceof Array) {
				let obj = v.map((sv) => {
					return deco(sv, count + 1, maximumDepth)
				})
				return obj
			}
		}
		let obj = {}
		Object.keys(v).forEach((k) => {
			obj[k] = deco(v[k], count + 1, maximumDepth)
		})
		return obj
	}
	switch (typeof v) {
		case 'string':
			v = v.toString()
			break
		case 'number':
			v = Number(v)
			break
		case 'boolean':
			v = !!v
			break

		default:
			break
	}
	return v
}
export const deepCopy = (v: any, maximumDepth: number = 10) => {
	try {
		return deco(v, 0, maximumDepth)
	} catch (error) {
		return JSON.parse(JSON.stringify(v))
	}
}

export class NetworkStatus extends EventTarget {
	constructor() {
		super()
	}
}
