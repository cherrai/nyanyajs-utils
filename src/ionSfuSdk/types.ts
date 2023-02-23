import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl'
import md5 from 'blueimp-md5'
import * as Ion from 'ion-sdk-js/lib/connector'

import { Client, LocalStream, RemoteStream } from 'ion-sdk-js'
import { UserAgent, userAgent } from '../userAgent'

export interface StreamStats {
	video: {
		bitrate?: number
		bytesReceived?: number
		frameWidth?: number
		frameHeight?: number
		framesPerSecond?: number
		framesDecoded?: number
		framesReceived?: number
		jitter?: number
		jitterBufferDelay?: number
		totalInterFrameDelay?: number
	}
	audio: {
		bitrate?: number
		bytesReceived?: number
		frameWidth?: number
		frameHeight?: number
		framesPerSecond?: number
		framesDecoded?: number
		framesReceived?: number
		jitter?: number
		jitterBufferDelay?: number
		totalInterFrameDelay?: number
	}
}


export interface DATAChannelRouterResponse {
	eventName: string
	requestId: string
	clientInfo: ClientInfo
	data: any
}

export type RouterFunc = (
	data: DATAChannelRouterResponse,
	call: {
		to: (clientId: string) => { emit: (data: any) => void }
		emit: (data: any) => void
		emitAll: (data: any) => void
	}
) => void

export interface ClientInfo {
	clientId: string
	roomId: string
	uid: string
	deviceId: string
	userInfo: {
		[k: string]: any
	}
	userAgent: UserAgent
}

export interface RoomClientsItem {
	clientInfo: ClientInfo
	publishStream: boolean
	dc: RTCDataChannel
}