import { SFUClient } from './client'
import { QueueLoop } from '../queueloop'
import * as Ion from 'ion-sdk-js/lib/connector'

import { Client, LocalStream, RemoteStream } from 'ion-sdk-js'
import { UserAgent, userAgent } from '../userAgent'

import { StreamStats, ClientInfo } from './types'

export class SFUStream extends EventTarget {
	private sfuClient: SFUClient
	queueloop: QueueLoop
	id: string
	clientInfo: ClientInfo
	type: 'Remote' | 'Local'
	callType: 'Audio' | 'Video' | 'ScreenShare'
	stream: LocalStream | RemoteStream
	constraints?: Ion.Constraints
	isSpeaker: boolean = false
	timeStamp: number = new Date().getTime()
	stats: StreamStats
	statsTemp: {
		[id: string]: {
			bytesPrev: number
			timestampPrev: number
		}
	} = {}
	constructor(options: {
		sfuClient: SFUClient
		id: string
		clientInfo?: ClientInfo
		type: 'Remote' | 'Local'
		callType: 'Audio' | 'Video' | 'ScreenShare'
		constraints?: Ion.Constraints
		stream: LocalStream | RemoteStream
		stats: StreamStats
	}) {
		super()
		this.sfuClient = options.sfuClient
		this.id = options.id
		this.callType = options.callType
		options.constraints && (this.constraints = options.constraints)
		this.clientInfo = options.clientInfo || {
			clientId: '',
			roomId: '',
			uid: '',
			deviceId: '',
			userInfo: {},
			userAgent: userAgent(''),
		}
		this.queueloop = new QueueLoop({
			delayms: 1000,
		})
		this.type = options.type
		this.stream = options.stream
		this.stats = options.stats
	}
	unmute(kind: 'video' | 'audio') {
		this.stream.unmute(kind)
		switch (kind) {
			case 'video':
				this.stream.getVideoTracks().forEach((track) => {
					track.dispatchEvent(new Event('unmute'))
				})
				break
			case 'audio':
				this.stream.getAudioTracks().forEach((track) => {
					track.dispatchEvent(new Event('unmute'))
				})
				break

			default:
				break
		}
	}
	mute(kind: 'video' | 'audio') {
		this.stream.mute(kind)
		switch (kind) {
			case 'video':
				this.stream.getVideoTracks().forEach((track) => {
					track.dispatchEvent(new Event('mute'))
				})
				break
			case 'audio':
				this.stream.getAudioTracks().forEach((track) => {
					track.dispatchEvent(new Event('mute'))
				})
				break

			default:
				break
		}
	}
	unpublish() {
		const ls: any = this.stream
		if (
			this.type === 'Local' &&
			this.sfuClient.dc.readyState === 'open' &&
			ls?.pc?.connectionState === 'connected'
		) {
			if (this.stream.getTracks().length) {
				// console.log(this.localStream.getTracks())
				this.stream.getTracks().forEach((track) => {
					track.dispatchEvent(new Event('ended'))
					track.stop()
					ls?.removeTrack(track)
					// this.sfuClient.dc.readyState === 'open' &&
					// 	track.readyState === 'live' &&
					// 	ls?.removeTrack(track)
				})
				this.stream.dispatchEvent(new Event('removetrack'))
				ls.unpublish()
				// this.dispatchEvent(new Event('removetrack'))
			}
		}
		this.queueloop.decreaseAll()
	}
	switchDevice(
		deviceType: 'audio' | 'video' | 'screenShare',
		deviceId: string
	) {
		console.log(deviceType, deviceId)
		const stream: any = this.stream
		switch (deviceType) {
			case 'screenShare':
				// console.log(stream.callType)
				// console.log(stream.callOptions)
				// console.log(stream)
				// this.sfuClient.publish(stream.callOptions, 'screenShare')
				break

			default:
				stream.switchDevice(deviceType, deviceId)
				break
		}
	}

	startStats() {
		if (this.type !== 'Remote') return this.dispatchEvent(new Event('stats'))
		this.queueloop.increase(
			this.id + 'getStats',
			async () => {
				const promiseAll: Promise<any>[] = []
				this.stream.getTracks().forEach((track) => {
					promiseAll.push(this.getStats(track, this))
				})
				const res = await Promise.all(promiseAll)

				res.forEach((data) => {
					switch (data.kind) {
						case 'audio':
							this.stats.audio = data.stats
							break
						case 'video':
							this.stats.video = data.stats
							break

						default:
							break
					}
				})

				this.dispatchEvent(new Event('stats'))
			},
			{
				loop: true,
			}
		)
	}

	public getStats(
		track: MediaStreamTrack,
		stream: SFUStream
	): Promise<{ results: RTCStatsReport; kind: string; stats?: any }> {
		return new Promise((res, rej) => {
			if (
				!this.sfuClient.c ||
				stream.type === 'Local' ||
				!track.enabled ||
				!stream.stream.getTracks().length
			) {
				rej('stream does not exist.')
				return
			}
			if (!this.statsTemp[stream.id]) {
				this.statsTemp[stream.id] = {
					bytesPrev: 0,
					timestampPrev: 0,
				}
			}
			let bytesPrev = this.statsTemp[stream.id].bytesPrev
			let timestampPrev = this.statsTemp[stream.id].timestampPrev

			// console.log(this.sfuClient.c)
			// console.log(this.queueloop)
			// console.log(stream)
			// console.log(track)
			this.sfuClient.c
				.getSubStats(track)
				.then((results) => {
					results.forEach((report) => {
						const now = report.timestamp

						let bitrate: number = 0
						if (stream.stream && report.type === 'inbound-rtp') {
							const bytes = report.bytesReceived
							if (timestampPrev) {
								// console.log(now - timestampPrev)
								bitrate = (8 * (bytes - bytesPrev)) / (now - timestampPrev)
								bitrate = Math.floor(bitrate) || 0
							}
							this.statsTemp[stream.id].bytesPrev = bytes
							this.statsTemp[stream.id].timestampPrev = now

							res({
								results: results,
								kind: track.kind,
								stats: {
									bitrate: bitrate,
									...report,
								},
							})
						}
					})

					res({
						results: results,
						kind: track.kind,
					})
				})
				.catch((error) => {
					// console.log('stats', track, stream, rej)
					rej(error)
				})
		})
	}
}
