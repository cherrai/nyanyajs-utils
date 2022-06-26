import { SFUClient } from './client'
import * as Ion from 'ion-sdk-js/lib/connector'
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl'
import md5 from 'blueimp-md5'
import { UserAgent, userAgent } from '../userAgent'
import { ClientInfo } from './types'

export class SFUSignal {
	signal?: IonSFUJSONRPCSignal
	uri: string
	token: string
	uid: string
	deviceId: string
	userAgent: UserAgent
	userInfo: { [k: string]: any }
	clients: {
		[roomId: string]: SFUClient
	} = {}
	constructor(
		uri: string,
		{
			token,
			deviceId,
			uid,
			userAgent,
			userInfo,
		}: {
			token: string
			uid: string
			deviceId: string
			userAgent: UserAgent
			userInfo: { [k: string]: any }
		}
	) {
		this.uri =
			uri +
			'?token=' +
			token +
			'&deviceId=' +
			deviceId +
			'&userAgent=' +
			JSON.stringify(userAgent)

		this.token = token
		this.deviceId = deviceId
		this.uid = uid
		this.userAgent = userAgent
		this.userInfo = userInfo
	}
	private new() {
		this.signal = new IonSFUJSONRPCSignal(this.uri)
		this.signal.onopen = async () => {
			console.log('onopen')
			// this.createDataChannel()
    }
		this.signal.onclose = async (e) => {
			console.log('onclose', e)
		}
		this.signal.onerror = async (error) => {
			console.log('onerror', error)
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
