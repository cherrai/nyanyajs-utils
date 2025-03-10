import { Client, LocalStream, RemoteStream } from 'ion-sdk-js'
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl'
import md5 from 'blueimp-md5'
import * as Ion from 'ion-sdk-js/lib/connector'
import { SFUStream } from './stream'
import {
  DATAChannelRouterResponse,
  RouterFunc,
  RoomClientsItem,
  ClientInfo,
  FileInfo,
} from './types'
import {
  Debounce,
  NEventListener,
  QueueLoop,
  SAaSS,
  Wait,
  file as nfile,
} from '..'
import { SFUSignal } from './signal'
import { getHash } from '../file'
const CryptoJS = require('crypto-js')

// import { formatConstraints, getMediaDevices } from './methods'

// navigator.mediaDevices
// 	.getDisplayMedia(displayMediaOptions)
// 	.then((stream) => {
// 		console.log('screenStream', stream)
// 	})

function ArrayBufferToString(buf: ArrayBuffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buf) as any)
}
function StringToArrayBuffer(str: string) {
  var buf = new ArrayBuffer(str.length * 2)
  var bufView = new Uint16Array(buf)
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}
function ConcatArrayBuffer(...arrays: ArrayBuffer[]) {
  let totalLen = 0

  for (let arr of arrays) totalLen += arr.byteLength

  let res = new Uint8Array(totalLen)

  let offset = 0

  for (let arr of arrays) {
    let uint8Arr = new Uint8Array(arr)

    res.set(uint8Arr, offset)

    offset += arr.byteLength
  }

  return res.buffer
}

export class SFUClient extends EventTarget {
  d = new Debounce()
  status: 'connected' | 'disconnect' = 'connected'
  public s: IonSFUJSONRPCSignal
  public c: Client
  public clientOption?: Ion.Configuration
  public dc?: RTCDataChannel
  public clientInfo: ClientInfo
  private routers: {
    [eventName: string]: (data: DATAChannelRouterResponse) => void
  } = {}
  private requests: {
    // all 为表示所有人
    [sendClientId: string]: {
      [eventName: string]: {
        [requestId: string]: {
          status?: 'sending' | 'succeed' | 'fail' | 'unsent'
          returnValue: boolean
          request: {
            data?: any
          }
          response: {
            data?: any
            func?: (data: any) => void
          }
        }
      }
    }
  } = {}
  public roomClients: {
    [id: string]: RoomClientsItem
  } = {}
  private onClose: () => void
  public onStream?: (stream: SFUStream) => void
  // public localStream?: Ion.LocalStream
  public streams: {
    [id: string]: SFUStream
  } = {}

  private joinWait = new Wait()
  private DATAChannelInitStatus = false
  private publishFunc?: () => void
  private queueLoop: QueueLoop
  private maxQueueNum = 5
  private currentQueueNum = 0
  private fileQueue: {
    // chunkSize  16 * 1024
    // 16 *1024 ~ 20 * 1024 区间
    // 每次最多5个队列
    [chunkSize: number]: {
      type: 'send' | 'receive'
      status: 'created' | 'sending' | 'succeeded' | 'abort' | 'error'
      // 如果是receive的话
      receiveBuffer: ArrayBuffer[]
      chunkSize: number
      offset: number
      file: File
      fileInfo: {
        type: string
        name: string
        size: number
        lastModified: number
      }
    }
  } = {}
  private type: 'Audio' | 'Video' | 'ScreenShare' = 'Audio'
  private callOptions: {
    [type: string]: Ion.Constraints
  } = {}

  private signal: SFUSignal

  constructor({
    s,
    signal,
    clientOption,
    clientInfo,
    onClose,
  }: {
    s: SFUSignal
    clientOption?: Ion.Configuration
    signal: IonSFUJSONRPCSignal
    clientInfo: ClientInfo
    onClose: () => void
  }) {
    super()
    this.signal = s
    this.s = signal
    this.clientInfo = clientInfo
    clientOption && (this.clientOption = clientOption)
    this.c = new Client(this.s, this.clientOption)
    console.log('this.clientOption', this.clientOption, this.c)
    this.onClose = onClose
    // const connector = new Ion.Connector('url', 'token')
    // const room = new Ion.Room(connector)
    // room.onleave
    this.queueLoop = new QueueLoop({
      delayms: 1000,
    })

    this.init()

    // setTimeout(() => {
  }
  async init() {
    this.c.onerrnegotiate = (e) => {
      console.log('sfu onerrnegotiate', e)
    }
    this.c.onactivelayer = (e) => {
      console.log('sfu onactivelayer', e)
    }

    this.c.onspeaker = (e) => {
      // console.log('sfu onspeaker', e)
      Object.keys(this.streams).forEach((id) => {
        if (e.includes(id)) {
          this.streams[id].isSpeaker = true
        } else {
          this.streams[id].isSpeaker = false
        }
        this.streams[id].dispatchEvent(new Event('speaker'))
      })
    }

    this.c.ondatachannel = (e) => {
      // 这是对方的实例，通过这个可以直接发送给对方
      const clientInfo: ClientInfo = JSON.parse(e.channel.label)
      const { clientId } = clientInfo
      // console.log('sfu datachannel', e, clientInfo)
      if (clientInfo && clientId && e.channel.readyState === 'open') {
        // if (this.roomClients[clientId]) {
        // 	this.roomClients[clientId].dc.close()
        // }
        this.roomClients[clientId] = {
          clientInfo: clientInfo,
          publishStream: false,
          dc: e.channel,
        }

        e.channel.onclose = (e) => {
          console.log('sfu datachannel sub onclose', e)
        }
        e.channel.onerror = (e) => {
          console.log('sfu datachannel sub onerror', e)
        }
        e.channel.onmessage = (e) => {
          // console.log('sfu datachannel sub onmessage', e)
        }
        e.channel.onopen = async () => {
          // to({
          // 	clientId: clientId,
          // }).emit(
          // 	'publishStream',
          // 	{
          // 		pushed: true,
          // 	},
          // 	{
          // 		onlySend: true,
          // 	}
          // )

          this.emitAllUnsentMessages('all')
          this.emitAllUnsentMessages(clientId)
        }
      }
    }

    this.c.ontrack = async (
      track: MediaStreamTrack,
      remoteStream: RemoteStream
    ) => {
      // console.log('sfu1 ontrack', track, remoteStream)
      const { router, emit, to } = this.DataChannelAPI()

      // track.onmute = (e) => {
      // 	console.log('sfu onmute', e)
      // }
      // track.onunmute = (e) => {
      // 	console.log('sfu onunmute', e)
      // }
      // track.onended = (e) => {
      // 	console.log('sfu onended', e)
      // }
      // 有
      if (this.streams[remoteStream.id]) {
        // this.streams[remoteStream.id].tracks.push(track)
      } else {
        // 没有

        // state.event.eventTarget.addEventListener('initEncryption', () => {
        //   console.log('initEncryption')
        //   dispatch('encryption/init')
        // })
        // const msse = new MediaStreamStatsEvent()
        // msse.addEventListener
        // state.event.eventTarget.dispatchEvent(new Event('initEncryption'))

        const stream = new SFUStream({
          sfuClient: this,
          id: remoteStream.id,
          stream: remoteStream,
          type: 'Remote',
          callType: 'Video',
          stats: {
            audio: {},
            video: {},
          },
        })

        this.streams[remoteStream.id] = stream
        // this.createDataChannel()

        remoteStream.addEventListener('removetrack', (e) => {
          // console.log('sfu remoteStreamonremovetrack', e)

          if (!remoteStream?.getTracks().length) {
            // console.log('关闭')
            // console.log(stream.queueloop)
            stream.queueloop.decreaseAll()
            // emit(
            // 	'unpublishStream',
            // 	{
            // 		streamId: remoteStream.id,
            // 	},
            // 	undefined,
            // 	{
            // 		onlySend: true,
            // 	}
            // )
            stream.republish()
            stream.dispatchEvent(new Event('removetrack'))
            delete this.streams[remoteStream.id]
          }
        })
        // remoteStream.onaddtrack = (e) => {
        // 	console.log('sfu onaddtrack', e)
        // }

        emit(
          'getClientIdByStreamId',
          {
            streamId: remoteStream.id,
          },
          (data, destroy) => {
            // console.log(
            // 	'getClientIdByStreamId res',
            // 	remoteStream.id === data.data.streamId,
            // 	this.roomClients[data.data.clientId]
            // )
            if (
              remoteStream.id === data.data.streamId &&
              this.roomClients[data.data.clientId]
            ) {
              stream.clientInfo =
                this.roomClients[data.data.clientId].clientInfo

              stream.callType = data.data.callType
              this.onStream && this.onStream(stream)
              destroy()
            }
            // console.log('sfutest,获取到了返回值', data)
          }
        )
        // emit('get_track_info', {
        // 	id: stream.id,
        // })
      }
    }

    await this.join()
    // }, 1000)

    await this.joinWait.waiting()
    this.dc = this.createDataChannel()
  }
  private getRoomClientId(clientInfo: ClientInfo) {
    // 当track没有了则关闭监听
    return md5(
      JSON.stringify({
        roomId: clientInfo.roomId,
        uid: clientInfo.uid,
        deviceId: clientInfo.deviceId,
        userAgent: clientInfo.userAgent,
      })
    )
  }
  public async getMediaDevices() {
    return await navigator?.mediaDevices?.enumerateDevices()
  }
  private async formatConstraints(constraints: Ion.Constraints) {
    let isVideoInput: MediaDeviceInfo[] = []
    let isAudioInput: MediaDeviceInfo[] = []
    const mediaDevices = await this.getMediaDevices()

    mediaDevices.forEach((item) => {
      if (item.kind === 'videoinput') {
        isVideoInput.push(item)
      }
      if (item.kind === 'audioinput') {
        isAudioInput.push(item)
      }
    })
    if (!isAudioInput.length) {
      constraints.audio = false
    }
    if (!isVideoInput.length) {
      constraints.video = false
    }
    return constraints
  }
  public unpublish(streamId: string) {
    const { router, emit, to } = this.DataChannelAPI()

    if (this.streams[streamId]) {
      if (this.streams[streamId].type === 'Local') {
        emit(
          'unpublishStream',
          {
            streamId: streamId,
          },
          undefined,
          {
            onlySend: true,
          }
        )
      }
      this.streams[streamId].unpublish()
      delete this.streams[streamId]
    }
  }
  public republish(streamId: string) {
    console.log(
      '正在republish',
      this.clientInfo,
      this.streams[streamId],
      this.streams[streamId]?.status,
      this.callOptions
    )
    // 后面改为ls直接publish
    // this.localStream && this.c.publish(this.localStream)
    // this.unpublish(streamId)
    // this.d.increase(() => {
    // 	this.publish(this.callOptions[this.type], this.type)
    // }, 1000)
    if (this.streams[streamId] && this.streams[streamId].type === 'Local') {
      if (this.streams[streamId].status === 'connected') {
        const stream: any = this.streams[streamId].stream
        // stream?.publish?.()
      } else {
        this.publish(this.callOptions[this.type], this.type)
      }
    } else {
      // this.unpublish(streamId)
      // this.d.increase(() => {
      // 	this.publish(this.callOptions[this.type], this.type)
      // }, 1000)
    }

    // Object.keys(this.callOptions).forEach((type) => {})
    // this.localStream?.id && this.unpublish()
    // this.localStream.switchDevice
    // this.publish(this.localStream['callOption'], this.localStream['callType'])
  }
  // 如果黑屏检测流是否正常，不正常就重来
  public async publish(
    constraints: Ion.Constraints,
    type: 'Audio' | 'Video' | 'ScreenShare'
  ): Promise<SFUStream> {
    return new Promise(async (res, rej) => {
      try {
        await this.joinWait.waiting()

        console.log('------sfu publishFunc------')
        constraints = await this.formatConstraints(constraints)

        this.type = type
        this.callOptions[type] = constraints

        const { router, emit, to } = this.DataChannelAPI()

        const ls =
          type === 'ScreenShare'
            ? await this.getDisplayMedia(constraints)
            : await this.getUserMedia(constraints)
        const cts: any = ls.constraints
        console.log('sfu ls', ls)
        ls.api = this.dc

        const stream = new SFUStream({
          sfuClient: this,
          id: ls.id,
          clientInfo: this.clientInfo,
          stream: ls,
          type: 'Local',
          callType: type,
          constraints: constraints,
          stats: {
            audio: {},
            video: {
              frameWidth: cts?.video['width'],
              frameHeight: cts?.video['height'],
              framesPerSecond: cts?.video['frameRate'],
            },
          },
        })
        ls.getTracks().forEach((track) => {
          // console.log(track.kind, type)
          if (track.kind === 'audio' && type === 'Audio') {
            // console.log('禁止掉视频')
            stream.mute('video')
          }
          track.addEventListener('ended', (e) => {
            console.log('sfu ended', e, track)
            delete this.streams[ls.id]
            ls.removeTrack(track)
            if (type === 'ScreenShare') {
              ls.unpublish()
            }
            // emit(
            // 	'unpublishStream',
            // 	{
            // 		streamId: ls.id,
            // 	},
            // 	null,
            // 	{
            // 		onlySend: true,
            // 	}
            // )
            // stream.dispatchEvent(new Event('removetrack'))
          })
        })
        ls.addEventListener('removetrack', () => {
          console.log('sfu onremovetrack')
          if (!ls?.getTracks().length) {
            stream.queueloop.decreaseAll()
            emit(
              'unpublishStream',
              {
                streamId: ls.id,
              },
              undefined,
              {
                onlySend: true,
              }
            )
            stream.dispatchEvent(new Event('removetrack'))
          }
        })

        this.streams[ls.id] = stream
        this.status === 'connected' && this.c.publish(ls)
        this.onStream && this.onStream(stream)

        emit('publishStream', {
          streamId: ls.id,
        })
        res(stream)
        delete this.publishFunc
      } catch (error: any) {
        this.callOptions[type] = constraints

        console.error(error)
        rej({
          code: error?.code,
          err: error,
        })
      }
    })
  }
  public async getUserMedia(constraints?: Ion.Constraints) {
    return await LocalStream.getUserMedia(constraints)
  }
  public async getDisplayMedia(constraints?: Ion.Constraints) {
    return await LocalStream.getDisplayMedia(constraints)
  }
  private async join() {
    return new Promise(async (res) => {
      console.log('sfu1  this.s.onopen', 1)
      await this.signal.openWait.waiting()

      console.log(
        'sfu1  this.s.onopen',
        2,
        this.clientInfo.roomId,
        md5(JSON.stringify(this.clientInfo) + 'nyanya')
      )
      await this.c.join(
        this.clientInfo.roomId,
        md5(JSON.stringify(this.clientInfo) + 'nyanya')
      )
      console.log('sfu1  this.s.onopen', 34)
      this.joinWait.dispatch()
      res(undefined)
    })
  }
  leave() {
    Object.keys(this.streams).forEach((id) => {
      this.unpublish(id)
    })
    this.d.increase(() => { }, 100)
    this.c.leave()
    this.queueLoop.decreaseAll()
  }
  public close() {
    try {
      this.status = 'disconnect'
      this.leave()
      this.c.close()
      this.onClose()
      this.DATAChannelInitStatus = false
    } catch (error) {
      console.error(error)
    }
  }
  public setUserInfo(userInfo: { [k: string]: any }) {
    this.clientInfo.userInfo = userInfo
  }
  public getClientId() { }
  public DataChannelAPI() {
    const send = (
      eventName: string,
      clientId: string,
      requestId: string,
      data: any
    ) => {
      // console.log(
      // 	eventName,
      // 	clientId,
      // 	requestId,
      // 	data,
      // 	this.roomClients[clientId]?.dc?.readyState
      // )
      if (this.roomClients[clientId]?.dc?.readyState === 'open') {
        const msg = JSON.stringify({
          eventName: eventName,
          requestId: requestId,
          clientInfo: this.clientInfo,
          data: data,
        })
        // console.log(msg.length)
        // var buf = new ArrayBuffer(msg.length*2) // 2 bytes for each char
        // var bufView = new Uint16Array(buf)
        // for (var i = 0, strLen = msg.length; i < strLen; i++) {
        // 	bufView[i] = msg.charCodeAt(i)
        // }

        this.roomClients[clientId]?.dc?.send(msg)
      }
    }

    const api = {
      to: (options: { clientId?: string; uid?: string; deviceId?: string }) => {
        let clientId = options.clientId || ''
        if (!options.clientId) {
          Object.keys(this.roomClients).some((id) => {
            let bool = false
            if (options.uid) {
              if (this.roomClients[id].clientInfo.uid === options?.uid) {
                bool = true
              } else {
                bool = false
              }
            }
            if (options.deviceId) {
              if (
                this.roomClients[id].clientInfo.deviceId === options?.deviceId
              ) {
                bool = true
              } else {
                bool = false
              }
            }

            if (bool) {
              clientId = id
              return true
            }
          })
        }
        return {
          // 发送给指定的人就要带自己的clientId
          emit: (
            eventName: string,
            data: any,
            options?: {
              onlySend?: boolean
              requestId?: string
            }
          ) => {
            if (!clientId) {
              return
            }
            const requestId =
              options?.requestId ||
              md5(JSON.stringify(data) + '_' + new Date().getTime())
            if (!options?.onlySend) {
              if (!this.roomClients[clientId]?.dc) {
                !this.requests[clientId] && (this.requests[clientId] = {})
                !this.requests[clientId][eventName] &&
                  (this.requests[clientId][eventName] = {})

                this.requests[clientId][eventName][requestId] = {
                  status: this.roomClients[clientId]?.dc ? 'succeed' : 'unsent',
                  returnValue: false,
                  request: {
                    data: data,
                  },
                  response: {},
                }
              }
            }
            // console.log(
            // 	'sfutest emit 发送',
            // 	!options?.onlySend,
            // 	!this.roomClients[clientId]?.dc,
            // 	this.roomClients[clientId]?.dc,
            // 	{
            // 		eventName: eventName,
            // 		clientInfo: this.clientInfo,
            // 		data: data,
            // 	},
            // 	this.requests
            // )
            if (clientId && this.roomClients[clientId]?.dc) {
              send(eventName, clientId, requestId, data)
            }
          },
          request: (
            eventName: string,
            data: any
          ): Promise<DATAChannelRouterResponse> => {
            return new Promise((res, rej) => {
              try {
                if (!clientId) {
                  return
                }
                const requestId = md5(
                  JSON.stringify(data) + '_' + new Date().getTime()
                )
                !this.requests[clientId] && (this.requests[clientId] = {})
                !this.requests[clientId][eventName] &&
                  (this.requests[clientId][eventName] = {})

                this.requests[clientId][eventName][requestId] = {
                  status: this.roomClients[clientId]?.dc ? 'succeed' : 'unsent',
                  returnValue: true,
                  request: {
                    data: data,
                  },
                  response: {
                    func: (data) => {
                      res(data)
                      delete this.requests[clientId][eventName][requestId]
                    },
                  },
                }

                send(eventName, clientId, requestId, data)
              } catch (error) {
                rej(error)
              }
            })
          },
        }
      },
      sendFile: async (
        clientId: string,
        file: File,
        event?: {
          oncreated?: (fileInfo: FileInfo) => boolean
          onreceiving?: () => void
          onsending?: (fileInfo: FileInfo, uploadedSize: number) => void
          onsuccess?: (fileInfo: FileInfo) => void
          onabort?: () => void
          onerror?: (err: Error) => void
        }
      ) => {
        console.log(clientId)
        let isAbort = false
        let offset = 0
        let chunkSize = 60 * 1024
        let width = 0
        let height = 0

        try {
          const fi = await nfile.getFileInfo(file)
          if (fi) {
            const fileInfo: FileInfo = {
              id: md5(fi.hash),
              chunkSize: chunkSize,
              ...fi,
            }
            if (event?.oncreated?.(fileInfo)) {
              api
                .to({
                  clientId,
                })
                .emit('file-oncreated', fileInfo)

              const reader = new FileReader()
              reader.onload = async (e) => {
                if (!e.target?.result || isAbort) {
                  event?.onabort?.()
                  return
                }

                // console.log(options, offset, offset + chunkSize)
                const result: any = e.target?.result

                const blob = new Blob(
                  [e.target.result],
                  {}
                  // encodeURIComponent(
                  // 	JSON.stringify({
                  // 		offset: offset.toString(),
                  // 		hash: hash,
                  // 		// 有问题
                  // 		final: e.total + offset === file.size ? 'ok' : 'no',
                  // 	})
                  // )
                )
                const buf = new ArrayBuffer(64)
                const str = new TextDecoder().decode(buf)
                // console.log(
                // 	'onsending1',
                // 	// (e.target.result as string).length,
                // 	// blob,
                // 	file.size,
                // 	offset,
                // 	chunkSize
                // )

                // ArrayBufferToString(
                //   arrayBuffer.slice(blob.size, blob.size + strbf.byteLength)
                // )
                offset += chunkSize

                // const offsetAB = StringToArrayBuffer(
                // 	String(offset > file.size ? file.size : offset).padStart(5, '0')
                // )

                const sizeAB = StringToArrayBuffer(
                  String(blob.size).padStart(5, '0')
                )

                const hashAB = StringToArrayBuffer(
                  JSON.stringify({
                    hash: fi.hash,
                    offset: offset > file.size ? file.size : offset,
                  })
                )
                // console.log('onsending1', hash, strbf, e.target.result)
                // console.log(
                // 	String(offset > file.size ? file.size : offset).padStart(
                // 		12,
                // 		'0'
                // 	),
                // 	sizeAB,
                // 	offsetAB,
                // 	hashAB
                // )
                const arrayBuffer = ConcatArrayBuffer(
                  e.target.result as any,
                  hashAB,
                  sizeAB
                )

                event?.onsending?.(
                  fileInfo,
                  offset > file.size ? file.size : offset
                )
                // api.send(clientId, e.target.result)
                // api.send(clientId, { file: e.target.result })
                // api.send(clientId, blob)
                api.send(clientId, arrayBuffer)

                // new RTCDataChannel.Buffer(ByteBuffer.wrap(msg), false);

                // api
                // 	.to({
                // 		clientId,
                // 	})
                // 	.emit('file-onreceiving', {
                // 		chunk: e.target.result,
                // 		hash: hash,
                // 		offset: offset > file.size ? file.size : offset,
                // 	})
                if (offset > file.size) {
                  event?.onsuccess?.(fileInfo)

                  return
                }

                reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
              }
              reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
            }
          }
        } catch (error) {
          event?.onerror?.(error as Error)
        }

        return {
          abort: () => {
            isAbort = true
          },
        }
      },
      receiveFile: (event?: {
        oncreated?: (fileInfo: FileInfo, clientInfo: ClientInfo) => void
        onreceiving?: (fileInfo: FileInfo, uploadedSize: number) => void
        onsuccess?: (fileInfo: FileInfo, file: File) => void
        onabort?: () => void
        onerror?: (error: Error) => void
      }) => {
        let isAbort = false

        const files: {
          [hash: string]: {
            receiveBuffer: ArrayBuffer[]
            // 0 / 1
            status: number
            fileInfo: FileInfo
          }
        } = {}
        try {
          const onSuccess = (hash: string) => {
            const file = files[hash]
            console.log('fileonsuccess', files[hash], files)
            files[hash].status = 1
            // delete files[data.data.hash]
            // 创建文件
            const received = new File(
              [
                new Blob(file.receiveBuffer, {
                  type: file.fileInfo.type,
                }),
              ],
              file.fileInfo.name,
              {
                type: file.fileInfo.type,
                lastModified: file.fileInfo.lastModified,
              }
            )
            event?.onsuccess?.(file.fileInfo, received)
          }
          api.router('file-oncreated', (data) => {
            if (files[data.data.hash]?.status === 1) {
              onSuccess(data.data.hash)
              return
            }
            files[data.data.hash] = {
              fileInfo: data.data,
              status: 0,
              receiveBuffer: [],
            }
            console.log('file-oncreated', data.data, files[data.data.hash])
            event?.oncreated?.(data.data, data.clientInfo)
          })

          api.router('file-onreceiving', (data) => {
            console.log('file-onreceiving', data, files)
            files[data.data.hash].receiveBuffer.push(data.data.chunk)

            const file = files[data.data.hash]

            event?.onreceiving?.(file.fileInfo, data.data.offset)

            if (data.data.offset === file.fileInfo.size) {
              onSuccess(data.data.hash)
            }
            // event?.onreceiving?.(data.data, data.clientInfo)
          })
        } catch (error) {
          event?.onerror?.(error as Error)
        }
        return {
          // 预留
          abort: () => {
            isAbort = true
          },
        }
      },
      send: (clientId: string, data: any) => {
        // console.log(
        // 	clientId,
        // 	this.roomClients,
        // 	this.roomClients[clientId],
        // 	this.dc,
        // 	data.length
        // )
        this.roomClients[clientId]?.dc?.send(data)
      },
      // 发送给所有人就不要带自己的clientId
      emit: (
        eventName: string,
        data: any,
        routerFunc?: (
          data: DATAChannelRouterResponse,
          destroy: () => void
        ) => void,
        options?: {
          onlySend?: boolean
          requestId?: string
        }
      ) => {
        const requestId =
          options?.requestId ||
          md5(JSON.stringify(data) + '_' + new Date().getTime())

        if (!options?.onlySend) {
          if (routerFunc) {
            api.router(eventName + '_response_' + requestId, (data) => {
              routerFunc(data, () => {
                delete this.routers[eventName + '_response_' + requestId]
                delete this.requests['all'][eventName]['requestId']
              })
            })
          }
          !this.requests['all'] && (this.requests['all'] = {})
          !this.requests['all'][eventName] &&
            (this.requests['all'][eventName] = {})
          this.requests['all'][eventName][requestId] = {
            returnValue: false,
            request: {
              data: data,
            },
            response: {},
          }
        }

        // console.log('sfu emit', eventName, data, this.roomClients)
        Object.keys(this.roomClients).forEach((id) => {
          send(eventName, id, requestId, data)
        })
      },
      // 不能多次调用
      router: (eventName: string, func: RouterFunc) => {
        this.routers[eventName] = (reqData) => {
          func(reqData, {
            to: (clientId: string) => {
              return {
                // 指定人
                emit: (resData) => {
                  // console.log(
                  // 	'sfu router emit to',
                  // 	this.roomClients[clientId],
                  // 	clientId,
                  // 	data
                  // )
                  api
                    .to({
                      clientId: clientId,
                    })
                    .emit(
                      eventName + '_response_' + reqData.requestId,
                      resData,
                      {
                        onlySend: false,
                        requestId: reqData.requestId,
                      }
                    )
                },
              }
            },
            emit: (resData) => {
              api
                .to({ clientId: reqData.clientInfo.clientId })
                .emit(eventName + '_response_' + reqData.requestId, resData, {
                  onlySend: false,
                  requestId: reqData.requestId,
                })
            },
            emitAll: (data) => {
              // 所有人
              api.emit(eventName, data, undefined, {
                onlySend: false,
              })
            },
          })
        }
      },
    }
    return api
  }

  private emitAllUnsentMessages(clientId: string) {
    if (!this.requests[clientId]) return
    Object.keys(this.requests[clientId]).forEach((en) => {
      Object.keys(this.requests[clientId][en]).forEach((requestId) => {
        const request = this.requests[clientId][en][requestId]
        if (!request) return
        if (clientId === 'all') {
          this.DataChannelAPI().emit(en, request.request.data, undefined, {
            onlySend: true,
            requestId: requestId,
          })
        } else {
          if (request.status === 'unsent') {
            this.DataChannelAPI()
              .to({ clientId })
              .emit(en, request.request.data, {
                onlySend: true,
              })

            delete this.requests[clientId][en][requestId]
          }
        }
      })
    })
  }

  private initDataChannelRouter() {
    const { router, to, emit } = this.DataChannelAPI()

    router('unpublishStream', (data, call) => {
      console.log(
        'sfu,unpublishStream',
        data,
        this.streams,
        this.streams[data.data.streamId]
      )
      const stream = this.streams[data.data.streamId]
      if (stream) {
        stream.stream?.getTracks()?.forEach((track) => {
          stream.stream.removeTrack(track)
        })
        stream.dispatchEvent(new Event('removetrack'))
        delete this.streams[data.data.streamId]
        console.log(this.streams, this.streams[data.data.streamId])
      }
    })
    router('republishStream', (data, call) => {
      console.log('sfu,republishStream', this.clientInfo, data)
      this.republish(data.data.streamId)
    })
    // 对方发送信息过来已示何已推送。
    // 如若我之没有，则要求对方重发矣
    router('publishStream', (data, call) => {
      console.log('sfu,publishStream', data)
      this.queueLoop.increase(
        data.data.streamId + 'isGetStream',
        async () => {
          console.log('sfu,publishStream', this.streams[data.data.streamId])
          if (this.streams[data.data.streamId]) {
            this.queueLoop.decrease(data.data.streamId + 'isGetStream')
          } else {
            to({ clientId: data.clientInfo.clientId }).emit('republishStream', {
              streamId: data.data.streamId,
            })
          }
        },
        {
          loop: true,
        }
      )
    })
    // router('unpublishStream', (data, call) => {
    // 	console.log('sfu,unpublishStream', data)
    // 	this.roomClients &&
    // 		this.roomClients[data.clientInfo.clientId] &&
    // 		(this.roomClients[data.clientInfo.clientId].publishStream = false)
    // })
    router('getClientIdByStreamId', (data, call) => {
      console.log(
        'sfu,getClientIdByStreamId',
        data,
        this.streams,
        this.streams[data.data?.streamId],
        this.streams[data.data?.streamId]?.type === 'Local'
      )
      if (
        this.streams[data.data?.streamId] &&
        this.streams[data.data?.streamId]?.type === 'Local'
      ) {
        call.to(data.clientInfo.clientId).emit({
          streamId: data.data?.streamId,
          clientId: this.clientInfo.clientId,
          callType: this.streams[data.data?.streamId].callType,
        })
      } else {
        call.to(data.clientInfo.clientId).emit({
          streamId: '',
          clientId: '',
          callType: '',
        })
      }
    })
  }

  private createDataChannel() {
    const roomLabel: ClientInfo = this.clientInfo
    var options = { ordered: true, maxRetransmits: 30 }
    console.log('createDataChannel')
    this.dc = this.c.createDataChannel(
      JSON.stringify(
        Object.assign(roomLabel, {
          loginTime: Math.floor(new Date().getTime()),
        })
      )
      // options
    )
    console.log('createDataChannel', this.dc)
    // this.dc.binaryType = 'arraybuffer'
    console.log(this.dc.bufferedAmount)
    this.DATAChannelInitStatus = true
    const { router, emit, to } = this.DataChannelAPI()
    // init
    this.initDataChannelRouter()

    this.dc.onbufferedamountlow = (e) => {
      console.log('sfu datachannel onbufferedamountlow', e)
    }
    // let receiveBuffer = []
    this.dc.onmessage = async (message) => {
      // console.log('onmessage', message, message.data)
      // console.log(String.fromCharCode.apply(null, message.data as any))
      // file-oncreated

      // receiveBuffer.push(message.data)
      // // console.log(
      // // 	'dcmessage',
      // // 	// message,
      // // 	message.data.ffname,
      // // 	message.data.byteLength
      // // 	// receiveBuffer,
      // // 	// // Buffer.concat(receiveBuffer),
      // // 	// // new Blob(message.data, { type: 'application/octet-stream' }),
      // // 	// // new Blob(receiveBuffer, { type: 'application/octet-stream' }),
      // // 	// typeof message.data
      // // )
      // if (message.data.byteLength < 16 * 1024) {
      // 	console.log(receiveBuffer)
      // 	var received = new Blob(receiveBuffer, {
      // 		type: 'application/octet-stream',
      // 	})
      // 	console.log(received, received.size)

      // 	const a = document.createElement('a')
      // 	a.href = window.URL.createObjectURL(received)
      // 	a.download = '212121212121.zip'
      // 	a.textContent = `Click to download '${'fileName'}' (${'fileSize'} bytes)`
      // 	a.style.display = 'block'
      // 	document.body.appendChild(a)
      // 	// const img = document.createElement('img')
      // 	// img.src = window.URL.createObjectURL(received)

      // 	// document.body.appendChild(img)
      // }
      // if (!message?.data) {
      // 	return
      // }
      // return

      // console.log(message.data instanceof ArrayBuffer)
      if (message.data instanceof ArrayBuffer) {
        // console.log(message.data.byteLength)
        const size = Number(
          ArrayBufferToString(
            message.data.slice(
              message.data.byteLength - 10,
              message.data.byteLength
            )
          )
        )
        // console.log(
        // 	ArrayBufferToString(
        // 		message.data.slice(size, message.data.byteLength - 10)
        // 	)
        // )
        const infoObj: any = JSON.parse(
          ArrayBufferToString(
            message.data.slice(size, message.data.byteLength - 10)
          )
        )

        // console.log(this.routers, infoObj, this.requests)
        // this.requests[message.clientInfo.clientId][data.eventName][
        // 	data?.requestId
        // ]?.response?.func?.(data)
        this.routers['file-onreceiving']?.({
          data: {
            chunk: message.data.slice(0, size),
            hash: infoObj['hash'],
            offset: infoObj['offset'],
          },
        } as any)
        return
      }
      try {
        const data: DATAChannelRouterResponse = JSON.parse(message.data)
        if (this.clientInfo.roomId == data?.clientInfo?.roomId) {
          if (
            this.requests[data.clientInfo.clientId] &&
            this.requests[data.clientInfo.clientId][data.eventName] &&
            this.requests[data.clientInfo.clientId][data.eventName][
            data?.requestId
            ] &&
            this.requests[data.clientInfo.clientId][data.eventName][
              data?.requestId
            ].returnValue
          ) {
            this.requests[data.clientInfo.clientId][data.eventName][
              data?.requestId
            ]?.response?.func?.(data)
          } else {
            this.routers[data.eventName] && this.routers[data.eventName](data)
          }
        }
      } catch (error) {
        console.error(error)
      }
    }
    this.dc.onopen = async () => {
      console.log('------DataChannel创建成功------')
      this.dispatchEvent(new Event('dataChannelOpen'))
    }
    this.dc.onerror = (data) => {
      console.log('------DataChannel出错了------')
      // console.log('sfu DataChannel onerror', data)
      // this.close()
    }
    this.dc.onclose = (data) => {
      console.log('------DataChannel已关闭------')
      // console.log('sfu DataChannel onclose', data)
      // this.close()
    }
    return this.dc
  }
}
export default SFUClient
