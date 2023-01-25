import axios, {
	Method,
	AxiosResponse,
	AxiosRequestHeaders,
	AxiosResponseTransformer,
	AxiosRequestTransformer,
	AxiosRequestConfig,
	ResponseType,
} from 'axios'
import qs from 'qs'
import Long from 'long'
import { Buffer } from 'buffer'
// let userInfo = root.lookupType('Person')
// let infoData = { Name: 'xiaoming', Id: 24 }
// // 将js对象序列化成二进制
// let infoEncodeMessage = userInfo.encode(userInfo.create(infoData)).finish()
// console.log(userInfo.create(infoData))
// console.log(userInfo.encode(userInfo.create(infoData)))
// console.log(infoData)
// console.log(infoEncodeMessage)
// console.log(userInfo.decode(infoEncodeMessage))
// let blob = new Blob([infoEncodeMessage], { type: 'buffer' })

export type ResponseData<T = any> = {
	code: number
	data: T
	author: string
	cnMsg: string
	msg: string
	App: string
	requestTime: number
	responseTime: number
}
export type Response<T = any> = AxiosResponse<ResponseData<T>>
export interface requestConfig<T = any> {
	url?: string
	method?: Method
	transformRequest?: AxiosRequestTransformer | AxiosRequestTransformer[]
	transformResponse?: AxiosResponseTransformer | AxiosResponseTransformer[]
	headers?: AxiosRequestHeaders
	data?: any
	config?: T
	responseType?: ResponseType
}

export interface requestConfigType extends requestConfig {}
export type rct<T, C> = {
	// [R in keyof requestConfig]?: requestConfig[R]
	[K in keyof C & T]?: C[K]
}
const resq: requestConfig<{
	encryption: boolean
}> = {
	config: {
		encryption: true,
	},
}

// AxiosRequestConfig<any>
export const request = async <T = any>(
	config: requestConfig<T>
): Promise<Response> => {
	try {
		let responseTime = new Date().getTime()
		if (!config.data) {
			config.data = {}
		}
		config.data.requestTime = Math.floor(new Date().getTime() / 1000)

		interceptors.request.handlers.forEach((item) => {
			item?.fulfilled && (config = item.fulfilled(config))
		})
		let axiosConfig: any = {
			...config,
		}

		// const { state, commit, getters } = useStore()

		switch (String(axiosConfig.method).toUpperCase()) {
			case 'POST':
				axiosConfig.data = qs.stringify(axiosConfig.data)
				axiosConfig.headers = {
					'Content-Type': 'application/x-www-form-urlencoded',
				}
				break
			case 'GET':
				axiosConfig.params = config.data
				break

			default:
				break
		}
		let res = await axios(axiosConfig)
		res.config = {
			...res.config,
		}
		// console.log(res.data)
		// console.log(res.headers['content-type'])
		if (res.headers['content-type'] === 'application/x-protobuf') {
			res.data = {
				protobuf: res.data,
			}
		}
		if (!res.data) {
			res.data = {}
		}
		// console.log(res.data)
		res.data.responseTime = new Date().getTime() - responseTime

		if (res.data.responseTime >= 180 && res.data.responseTime < 280) {
			console.log(
				`[meowyeah request sdk] Warning: The current request consumed ${res.data.responseTime}ms.`
			)
		}
		if (res.data.responseTime >= 280) {
			console.log(
				`[meowyeah request sdk] Error: The current request consumed ${res.data.responseTime}ms.`
			)
		}
		interceptors.response.handlers.forEach((item) => {
			res = item.fulfilled(res)
		})
		return res
	} catch (error) {
		// console.log(error)
		let err: string = ''
		interceptors.request.handlers.forEach((item) => {
			item?.rejected && (err = String(item?.rejected(JSON.stringify(error))))
		})
		if (err) {
			return Promise.reject(JSON.parse(err))
		} else {
			return Promise.reject(error)
		}
	}
}

export type useRequestFunc = (config: requestConfig<any>) => requestConfig
export type useResponseFunc = (response: AxiosResponse) => AxiosResponse
export type useErr = (error: string) => string

class RequestInterceptorManager {
	handlers: {
		fulfilled: useRequestFunc
		rejected?: useErr
	}[] = []
	use(func: useRequestFunc, err?: useErr) {
		this.handlers.push({
			fulfilled: func,
			rejected: err,
		})
	}
}
class ResponseInterceptorManager {
	handlers: {
		fulfilled: useResponseFunc
		rejected?: useErr
	}[] = []
	use(func: useResponseFunc, err?: useErr) {
		this.handlers.push({
			fulfilled: func,
			rejected: err,
		})
	}
}

export const interceptors = {
	request: new RequestInterceptorManager(),
	response: new ResponseInterceptorManager(),
}

export const protobuf = {
	ParamsEncode: <T = any>(data: T, proto: T | any) => {
		try {
			return {
				data: Buffer.from(
					proto.encode(proto.create(data)).finish(),
					'base64'
				).toString('base64'),
			}
		} catch (error) {
			throw error
		}
	},

	ResponseDecode: <T = any>(
		response: Response,
		proto: T | any
	): ResponseData<T> => {
		try {
			if (
				// response.headers['content-type'] === 'application/x-protobuf' &&
				typeof response.data?.data === 'string'
			) {
				response.data.data = proto.decode(
					new Uint8Array(Buffer.from(response.data.data, 'base64'))
				)
			}
			response.data = protobuf.FoeEachLongToNumber(response.data)

			return response.data
		} catch (error) {
			throw error
		}
	},
	LongToNumber: (data: any): number => {
		if (data?.hasOwnProperty('low') && typeof data?.low === 'number') {
			const long = new Long(data.low, data.high, data.unsigned)

			return long.toNumber()
		}
		return data
	},
	FoeEachLongToNumber: (data: any) => {
		Object.keys(data).forEach((k) => {
			if (typeof data[k] === 'object') {
				if (data[k]?.hasOwnProperty('low')) {
					data[k] = protobuf.LongToNumber(data[k])
				} else {
					protobuf.FoeEachLongToNumber(data[k])
				}
			}
		})
		return data
	},
}
export default request
