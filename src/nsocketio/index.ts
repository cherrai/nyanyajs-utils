import io, { Manager } from 'socket.io-client'
import md5 from 'blueimp-md5'
import { NEventListener } from '../common/neventListener'
// import { QueueLoop } from '../'
import { QueueLoop } from '../'
// import { NEventListener, QueueLoop } from '@nyanyajs/utils'
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

export type responseMiddlewareType = (response: {
  data: any
  requestId: string
}) => {
  data: any
  requestId: string
}
// export type requestMiddlewareType = (params: {
// 	data: any
// 	requestId: string
// }) => Promise<{
// 	data: any
// 	requestId: string
// }>

// export type responseMiddlewareType = (response: {
// 	data: any
// 	requestId: string
// }) => Promise<{
// 	data: any
// 	requestId: string
// }>

export type RouterGroupApi = {
  router: ({
    eventName,
    func,
  }: {
    eventName: string
    func: (response: Response<any>) => void
  }) => RouterGroupApi
}

type Status = 'connected' | 'connecting' | 'disconnect' | 'close'

export class NSocketIoClient extends NEventListener<{
  connected: NSocketIoClient
  connecting: {
    reconnectCount: number
  }
  disconnect: NSocketIoClient
  close: NSocketIoClient
}> {
  status: Status = 'disconnect'
  private reconnectCount = 0
  maxReconnectCount = 0
  manager: SocketIOClient.Manager | undefined
  uri: string
  opts: SocketIOClient.ConnectOpts | undefined
  namespace: {
    [namespace: string]: SocketIOClient.Socket
  } = {}
  // 为0或负数则取消
  private heartbeatInterval = 10 * 1000
  eventNameRouter: any = {}
  private pingTimer?: QueueLoop
  constructor(options: {
    uri: string
    opts?: SocketIOClient.ConnectOpts
    heartbeatInterval?: number
    maxReconnectCount?: number
  }) {
    super()
    const { uri, opts, maxReconnectCount } = options
    this.uri = uri
    this.maxReconnectCount >= 0 &&
      (this.maxReconnectCount = maxReconnectCount || 0)
    this.opts = opts || {}
    options.hasOwnProperty('heartbeatInterval') &&
      (this.heartbeatInterval = options.heartbeatInterval || 0)

    this.heartbeatInterval &&
      (this.pingTimer = new QueueLoop({
        delayms: this.heartbeatInterval,
      }))
    // console.log(this.opts)
    try {
      this.manager = new Manager(this.uri, this.opts)
      console.log('this.manager', this.manager)
      let isShowLog = false
      this.manager?.on('connect', (attempt: any) => {
        this.reconnectCount = 0
        isShowLog && console.log('connect')
        this.setStatus('connected')
      })
      this.manager?.on('reconnect', (attempt: any) => {
        isShowLog && console.log('reconnect')
        this.reconnectCount++

        console.log('reconnectCount', this.reconnectCount)
        this.setStatus('connecting')
        if (this.maxReconnectCount && this.reconnectCount >= this.maxReconnectCount) {
          this.close()
        }
      })
      this.manager?.on('connect_error', (error: Error) => {
        isShowLog && console.log('connect_error', error)
        this.setStatus('disconnect')
      })
      this.manager?.on('connect_timeout', () => {
        isShowLog && console.log('connect_timeout')
        this.setStatus('disconnect')
      })
      this.manager?.on('reconnect_error', (error: Error) => {
        isShowLog && console.log('reconnect_failed', error)
        // console.log(deepCopy(store.state))
        // store.commit('app/setStatus', false)
        this.setStatus('disconnect')
      })
      // setInterval(() => {
      // 	store.commit('app/setStatus', !store.state.app.status)
      // }, 1000)
      this.manager?.on('reconnect_failed', () => {
        isShowLog && console.log('reconnect_failed')
        this.setStatus('disconnect')
      })
      this.manager?.on('disconnect', (attempt: any) => {
        isShowLog && console.log('disconnect')
        this.setStatus('disconnect')
      })
    } catch (error) {
      console.log(error)
    }
  }

  // static Response = Response
  private middleware: {
    request: requestMiddlewareType[]
    response: responseMiddlewareType[]
  } = {
      request: [],
      response: [],
    }
  public use = {
    request: (middleware: requestMiddlewareType) => {
      this.middleware.request.push(middleware)
    },
    response: (middleware: responseMiddlewareType) => {
      this.middleware.response.push(middleware)
    },
  }
  setStatus(s: Status) {
    if (this.status !== s) {
      this.status = s
      if (s === 'connecting') {
        this.dispatch(s, {
          reconnectCount: this.reconnectCount,
        })
        return
      }
      this.dispatch(s as any, this)
      // this.dispatchEvent(new Event(s))
    }
  }
  socket(namespace: string) {
    if (!this.manager) {
      return 'Not initialized.'
    }
    this.namespace[namespace] = this.manager.socket(namespace)

    this.namespace[namespace].on('connect', () => {
      this.ping(namespace)
    })

    this.namespace[namespace].on('reconnect', (attempt: any) => {
      this.setStatus('connecting')
      this.ping(namespace)
    })

    this.namespace[namespace].on('disconnect', (attempt: any) => {
      this.setStatus('disconnect')
    })
    this.namespace[namespace].on('connect_error', (attempt: any) => {
      this.setStatus('disconnect')
    })
    this.namespace[namespace].on('reconnect_error', (attempt: any) => {
      this.setStatus('disconnect')
    })
    this.namespace[namespace].on('connect_error', (attempt: any) => {
      this.setStatus('disconnect')
    })

    if (this.heartbeatInterval <= 0) return
    this.pingTimer?.decrease(namespace)

    this.pingTimer?.increase(namespace, () => {
      this.ping(namespace)
    })
  }
  private ping(namespace: string) {
    console.log('heartbeatInterval', this.heartbeatInterval)
    // if (this.heartbeatInterval <= 0) return

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
      console.log(
        'this.namespace[namespace].connected',
        this.namespace[namespace].connected
      )
      // console.log('ping1314',this.heartbeatInterval, this.namespace[namespace].connected)
      if (!this.namespace[namespace].connected) {
        return
      }
      const res = await this.emit({
        namespace: namespace,
        eventName: 'ping1314',
        params: {},
        options: {
          timeout: 1000,
        },
      })
      console.log(res)
      if (res?.data?.code === 200) {
        this.setStatus('connected')
      } else {
        this.setStatus('disconnect')
        // console.log('ping1314', res, res?.data?.code === 200)
        connect()
      }
    }
    send()
  }
  close() {
    this.pingTimer?.decreaseAll()
    Object.keys(this.namespace).forEach((namespace) => {
      this.namespace[namespace].disconnect()
    })
    this.setStatus('close')
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
    return new Promise(async (res, rej) => {
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

        eventName !== 'ping1314' &&
          this.middleware.request.forEach((item) => {
            requestParams = item(requestParams)
          })
        // console.log('emit: ', requestParams)
        this.router(namespace, eventName, requestParams, (data) => {
          // console.log('callback', data)

          eventName !== 'ping1314' &&
            this.middleware.response.forEach((item) => {
              data = item(data)
            })
          // console.log(params, data)

          timer && clearTimeout(timer)
          res(data)
        })

        // eventName !== 'ping1314' &&
        // 	(requestParams = await this.middlewareRequestForEach(requestParams))
        // // console.log('emit: ', requestParams)
        // this.router(namespace, eventName, requestParams, async (data) => {
        // 	console.log('callback', data)

        // 	eventName !== 'ping1314' &&
        // 		(requestParams = await this.middlewareResponseForEach(
        // 			requestParams
        // 		))
        // 	// console.log(params, data)

        // 	timer && clearTimeout(timer)
        // 	res(data)
        // })

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
  private async middlewareRequestForEach(
    params: {
      data: any
      requestId: string
    },
    index: number = 0
  ): Promise<{
    data: any
    requestId: string
  }> {
    if (this.middleware.request.length) {
      const c = await this.middleware.request[index](params)
      if (this.middleware.request.length - 1 === index) {
        return c
      }
      return await this.middlewareRequestForEach(c, index + 1)
    }
    return params
  }
  private async middlewareResponseForEach(
    response: {
      data: any
      requestId: string
    },
    index: number = 0
  ): Promise<{
    data: any
    requestId: string
  }> {
    if (this.middleware.response.length) {
      const c = await this.middleware.response[index](response)
      if (this.middleware.response.length - 1 === index) {
        return c
      }
      return await this.middlewareResponseForEach(c, index + 1)
    }
    return response
  }
}
export default NSocketIoClient
