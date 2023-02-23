import { SFUClient } from './client'
import * as Ion from 'ion-sdk-js/lib/connector'
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl'
import md5 from 'blueimp-md5'
import { UserAgent, userAgent } from '../userAgent'
import { ClientInfo } from './types'
import { NEventListener, Wait } from '..'

export class SFUSignal extends NEventListener<'open' | 'close' | 'error'> {
	signal?: IonSFUJSONRPCSignal
	uri: string
	token: string
	uid: string
	deviceId: string
	userAgent: UserAgent
	userInfo: { [k: string]: any }
	customData: {
		[k: string]: any
	}
	clients: {
		[roomId: string]: SFUClient
	} = {}
	openWait = new Wait()
	constructor(
		uri: string,
		{
			token,
			deviceId,
			uid,
			userAgent,
			userInfo,
			customData,
		}: {
			token: string
			uid: string
			deviceId: string
			userAgent: UserAgent
			userInfo: { [k: string]: any }
			customData: {
				[k: string]: any
			}
		}
	) {
		super()
		// this.uri = uri
		this.uri =
			uri +
			'?token=' +
			token +
			'&deviceId=' +
			deviceId +
			'&userAgent=' +
			JSON.stringify(userAgent) +
			'&customData=' +
			JSON.stringify(customData)

		this.token = token
		this.deviceId = deviceId
		this.uid = uid
		this.userAgent = userAgent
		this.userInfo = userInfo
		this.customData = customData
	}
	private new() {
		console.log('this.uri', this.uri)
		this.signal = new IonSFUJSONRPCSignal(this.uri)
		this.signal.onopen = () => {
			// console.log('onopen')
			this.openWait.dispatch()
			this.dispatch('open')
			// this.createDataChannel()
		}
		this.signal.onclose = (e) => {
			// console.log('onclose', e)
			this.dispatch('close', e)
		}
		this.signal.onerror = (error) => {
			// console.log('onerror', error)
			this.dispatch('error', error)
		}
		return this.signal
	}
	public getClient(roomId: string) {
		return this.clients[roomId]
	}
	public createClient(roomId: string, clientOption?: Ion.Configuration) {
		const clientId = md5(roomId + '_' + this.uid + '_' + this.deviceId)
		if (this.clients[clientId]) {
			return this.clients[roomId]
		}
		this.signal = this.new()
		const clientInfo: ClientInfo = {
			clientId,
			roomId,
			uid: this.uid,
			deviceId: this.deviceId,
			userInfo: this.userInfo,
			userAgent: this.userAgent,
		}
		this.clients[clientId] = new SFUClient({
			s: this,
			signal: this.signal,
			clientOption: clientOption,
			clientInfo: clientInfo,
			onClose: () => {
				delete this.clients[clientId]
			},
		})
		return this.clients[clientId]
	}
	public removeClient(roomId: string, clientOption?: Ion.Configuration) {
		const clientId = md5(roomId + '_' + this.uid + '_' + this.deviceId)
		if (this.clients[clientId]) {
			return this.clients[roomId]
		}
		this.signal = this.new()
		const clientInfo: ClientInfo = {
			clientId,
			roomId,
			uid: this.uid,
			deviceId: this.deviceId,
			userInfo: this.userInfo,
			userAgent: this.userAgent,
		}
		this.clients[clientId] = new SFUClient({
			s: this,
			signal: this.signal,
			clientOption: clientOption,
			clientInfo: clientInfo,
			onClose: () => {
				delete this.clients[clientId]
			},
		})
		return this.clients[clientId]
	}
	public close() {
		this.signal?.close()
		Object.keys(this.clients).forEach((k) => {
			this.clients[k].close()
		})
	}
}

export default SFUSignal
