import io, { Manager } from 'socket.io-client'
import md5 from 'blueimp-md5'
export type ResponseData<T = any> = {
	code: number
	data: T
	author?: string
	cnMsg: string
	msg: string
	App?: string
	requestTime?: number
	responseTime?: number
}
export type Response<T = any> = {
	requestId: string
	data: ResponseData<T>
}

export type requestMiddlewareType = (params: {
	data: any
	requestId: string
}) => {
	data: any
	requestId: string
}

export type responseMiddlewareType = (response: Response) => Response

export type RouterGroupApi = {
	router: ({
		eventName,
		func,
	}: {
		eventName: string
		func: (response: Response<any>) => void
	}) => RouterGroupApi
}

export class NSocketIoClient {
	manager: SocketIOClient.Manager | undefined
	uri: string
	opts: SocketIOClient.ConnectOpts | undefined
	namespace: {
		[namespace: string]: SocketIOClient.Socket
	} = {}
	private heartbeatInterval = 60 * 1000
	eventNameRouter: any = {}
	constructor(uri: string, opts?: SocketIOClient.ConnectOpts) {
		this.uri = uri
		this.opts = opts || {}

		// console.log(this.opts)
		try {
			this.manager = new Manager(this.uri, this.opts)
		} catch (error) {
			console.log(error)
		}
	}
	static Response = Response
	static middleware: {
		request: requestMiddlewareType[]
		response: responseMiddlewareType[]
	} = {
		request: [],
		response: [],
	}
	static use = {
		request(middleware: requestMiddlewareType) {
			NSocketIoClient.middleware.request.push(middleware)
		},
		response(middleware: responseMiddlewareType) {
			NSocketIoClient.middleware.response.push(middleware)
		},
	}
	socket(namespace: string) {
		if (!this.manager) {
			return 'Not initialized.'
		}
		this.namespace[namespace] = this.manager.socket(namespace)

		this.ping(namespace)
	}
	private ping(namespace: string) {
		// this.namespace[namespace].on('ping1314', (res:any) => {
		// 	console.log(res)
		// })
		const connect = () => {
			this.namespace[namespace]?.listeners('disconnect')?.forEach((v) => {
				v()
			})
			this.namespace[namespace].connect()
		}
		const send = async () => {
			// console.log('ping1314',this.heartbeatInterval, this.namespace[namespace].connected)
			if (!this.namespace[namespace].connected) {
				return
			}
			const res = await this.emit({
				namespace: namespace,
				eventName: 'ping1314',
				params: {
					a: '1',
				},
				options: {
					timeout: 5000,
				},
			})
			if (res?.data?.code === 200) {
			} else {
				console.log('ping1314', res, res?.data?.code === 200)
				connect()
			}
		}
		send()
		setInterval(() => {
			send()
		}, this.heartbeatInterval)
	}
	close() {
		Object.keys(this.namespace).forEach((namespace) => {
			this.namespace[namespace].disconnect()
		})
	}
	router(
		namespace: string,
		eventName: string,
		params: any,
		callback: (data: any) => void
	) {
		// console.log(namespace, eventName)
		if (!this.eventNameRouter[namespace]) {
			this.eventNameRouter[namespace] = {}
		}
		if (!this.eventNameRouter[namespace][eventName]) {
			// console.log(namespace, eventName)
			this.eventNameRouter[namespace][eventName] = {
				func: (data: any) => {
					// console.log('data router', params, data)
					// console.log(this.eventNameRouter[namespace][eventName].callback)
					if (
						this.eventNameRouter[namespace][eventName].callback[data.requestId]
					) {
						// console.log(data)
						this.eventNameRouter[namespace][eventName].callback[data.requestId](
							data
						)
					}
				},
				callback: {},
			}
			this.namespace[namespace].on(eventName, (data: any) => {
				this.eventNameRouter[namespace][eventName]['func'](data)
			})
		}
		// console.log(params.requestId)
		this.eventNameRouter[namespace][eventName].callback[params.requestId] =
			callback
	}
	emit({
		namespace,
		eventName,
		params,
		options,
	}: {
		namespace: string
		eventName: string
		params: any
		options?: {
			timeout?: number
		}
	}): Promise<Response<any>> {
		return new Promise((res, rej) => {
			try {
				// console.log(
				// 	namespace + eventName + JSON.stringify(params) + new Date().getTime()
				// )
				// console.log('socketio', deepCopy(this), this.manager?.readyState)
				// Object.keys(this.namespace).forEach((namespace) => {
				// 	if (this.namespace[namespace].connected) {
				// 		console.log(namespace, '=> 连接成功')
				// 	} else {
				// 		console.log(namespace, '=> 连接失败')
				// 	}
				// })
				let requestParams = {
					data: params,
					requestId: md5(
						namespace +
							eventName +
							JSON.stringify(params) +
							new Date().getTime()
					),
				}
				// console.log(
				// 	namespace + eventName + JSON.stringify(params) + new Date().getTime()
				// )
				// console.log(
				// 	md5(
				// 		namespace +
				// 			eventName +
				// 			JSON.stringify(params) +
				// 			new Date().getTime()
				// 	)
				// )
				// console.log('params', eventName, requestParams)

				const timer = setTimeout(() => {
					res({
						requestId: requestParams.requestId,
						data: {
							code: 9999,
							data: 'Request timed out',
							cnMsg: '请求超时',
							msg: 'Request timed out',
						},
					})
				}, options?.timeout || 5000)

				NSocketIoClient.middleware.request.forEach((item) => {
					requestParams = item(requestParams)
				})
				// console.log('emit: ', requestParams)
				this.router(namespace, eventName, requestParams, (data) => {
					// console.log('callback', data)

					NSocketIoClient.middleware.response.forEach((item) => {
						data = item(data)
					})
					// console.log(params, data)

					timer && clearTimeout(timer)
					res(data)
				})

				// console.log(
				// 	this.namespace[namespace],
				// 	namespace,
				// 	eventName,
				// 	requestParams
				// )
				this.namespace[namespace].emit(eventName, requestParams)
			} catch (error) {
				rej(error)
			}
		})
	}
	routerGroup(namespace: string) {
		const api: RouterGroupApi = {
			router: ({ eventName, func }) => {
				this.namespace[namespace].on(eventName, (data: any) => {
					func({
						data: data,
						requestId: md5(namespace + eventName + new Date().getTime()),
					})
				})
				return api
			},
		}
		return api
	}
}
export default NSocketIoClient
