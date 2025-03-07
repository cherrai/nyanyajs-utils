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
export const deepCopy = <T = any>(v: T, maximumDepth: number = 10): T => {
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

export const byteConvert = (bytes: number) => {
  if (isNaN(bytes)) {
    return ''
  }
  let symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let exp = Math.floor(Math.log(bytes) / Math.log(2))
  if (exp < 1) {
    exp = 0
  }
  let i = Math.floor(exp / 10)
  bytes = bytes / Math.pow(2, 10 * i)
  let bstr = bytes.toString()
  if (bstr.length > bytes.toFixed(2).toString().length) {
    bstr = bytes.toFixed(2)
  }
  return bstr + ' ' + symbols[i]
}
