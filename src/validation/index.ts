type ValidateObj = { [k: string]: any }

export class ParameterValue {
	obj?: ValidateObj
	parameter: string
	rules: Rule[]
	constructor(options: { parameter: string; rules: Rule[] }) {
		this.parameter = options.parameter
		this.rules = options.rules
	}
}
export class Rule {
	parameterValue?: ParameterValue
	type: 'Required' | 'Type'
	v?: any
	constructor(options: { type: 'Required' | 'Type'; v?: any }) {
		this.type = options.type
		this.v = options.v
	}
	validate() {
		let b = false
		let obj = this.parameterValue?.obj
		let p = this.parameterValue?.parameter || ''
		let v = obj?.[p]
		switch (this.type) {
			case 'Required':
				// console.log(p, obj?.hasOwnProperty(p), typeof v, v, !!v)
				if (obj?.hasOwnProperty(p)) {
					switch (typeof v) {
						case 'string': {
							b = !!v
							break
						}
						default:
							b = true
							break
					}
				}
				// console.log(b)
				if (!b) {
					return '“' + p + '”: cannot be blank. '
				}
				break

			case 'Type':
				b = typeof v === this.v
				// console.log(b, typeof v, this.v)
				if (!b) {
					return (
						'“' +
						p +
						'”: The value type is wrong, it is ' +
						typeof v +
						', it must be ' +
						this.v +
						'. '
					)
				}
				break

			default:
				break
		}
		return ''
	}
}

export const validation = {
	Validate(obj: ValidateObj, ...parameters: ParameterValue[]) {
		// console.log('Validate', obj, parameters)
		let err = ''
		parameters.forEach((v) => {
			v.obj = obj
			v.rules.forEach((sv) => {
				sv.parameterValue = v
				const e = sv.validate()
				// console.log(e)
				err += e
			})
		})

		return err
	},
	Parameter(parameter: string, ...rules: Rule[]) {
		const pv = new ParameterValue({
			parameter: parameter,
			rules: rules,
		})
		return pv
	},
	Required() {
		return new Rule({
			type: 'Required',
		})
	},
	Type(
		t:
			| 'string'
			| 'bigint'
			| 'boolean'
			| 'function'
			| 'number'
			| 'object'
			| 'symbol'
			| 'undefined'
	) {
		return new Rule({
			type: 'Type',
			v: t,
		})
	},
}

export default validation
