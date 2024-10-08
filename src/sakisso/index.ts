import qs from 'qs'
import axios from 'axios'
import { UserAgent } from '../userAgent'
import { createLocalUser, getLocalUsers } from './localUser'

export type UserInfo = {
	uid: string
	username: string
	email: string
	phone: string
	nickname: string
	avatar: string
	bio: string
	city: string[]
	gender: -1 | 1 | 2 | 3 | 4 | 5
	birthday: string
	status: -1 | 0 | 1
	additionalInformation: {
		[k: string]: any
	}
	appData: {
		[k: string]: any
	}
	creationTime: number
	lastUpdateTime: number
	lastSeenTime: number
}

export const defaultValue: {
	userInfo: UserInfo
} = {
	userInfo: {
		uid: '',
		username: '',
		email: '',
		phone: '',
		nickname: '',
		avatar: '',
		bio: '',
		city: [],
		gender: -1,
		birthday: '',
		status: -1,
		additionalInformation: {},
		appData: {},
		creationTime: -1,
		lastUpdateTime: -1,
		lastSeenTime: -1,
	},
}

export class SakiSSOClient {
	private apiUrls = {
		v1: {
			prefix: '/api/v1',
			checkToken: '/user/check/token',
			// anonymousUserGetAppToken: '/anonymousUser/appToken/get',
			// anonymousUserVerifyAppToken: '/anonymousUser/appToken/verify',
			// anonymousUserVerifyToken: '/anonymousUser/token/verify',
		},
	}
	appId: string = ''
	// appKey: string = ''
	token: string = ''
	deviceId: string = ''
	clientUrl: string = ''
	serverUrl: string = ''
	loginTime: number = 0
	userInfo: any = {}
	effectiveDays: number = 21
	userAgent?: UserAgent
	constructor({
		appId,
		// appKey,
		clientUrl,
		serverUrl,
		userAgent,
	}: {
		appId: string
		// appKey: string
		clientUrl: string
		serverUrl: string
		userAgent: UserAgent
	}) {
		// console.log(appId, appKey, ssoUrl)
		appId && (this.appId = appId)
		// appKey && (this.appKey = appKey)
		clientUrl && (this.clientUrl = clientUrl)
		serverUrl && (this.serverUrl = serverUrl)
		userAgent && (this.userAgent = userAgent)

		// this.anonymousUser = this.initAnonymousUser() as any
	}
	logout() {
		this.clear()
		// 去SSO删除token
		const loginUrl = this.clientUrl + '/logout'
		const iframe = document.createElement('iframe')
		iframe.src = loginUrl

		iframe.style.display = 'none'
		document.body.append(iframe)
		return true
	}
	clear() {
		this.token = ''
		this.loginTime = 0
		this.userInfo = {}
		localStorage.removeItem('loginTime')
		localStorage.removeItem('token')
		localStorage.removeItem('userInfo')
	}
	// 获取当前登录的用户c
	async login() {
		// console.log('login')
		// 1、获取token
		const params = qs.parse(window.location.search.split('?')[1])

		// 1、先檢測URL裡是否有Token 有則清楚
		if (params.token && params.loginTime) {
			this.token = String(params.token)
			this.deviceId = String(params.deviceId)
			this.loginTime = Number(params.loginTime)
			// 判断有效性
			if (
				!(
					this.loginTime &&
					Math.floor(new Date().getTime() / 1000) +
						3600 * 24 * this.effectiveDays >=
						this.loginTime
				)
			) {
				// this.goSso(params)
				this.clear()
			} else {
				// 同样需要加密存储，客户端无需使用缓存，
				// 让程序自己缓存
				localStorage.setItem('loginTime', String(this.loginTime))
				localStorage.setItem('token', this.token)
				localStorage.setItem('deviceId', this.deviceId)
				// const newPrams = { ...params }
				// delete newPrams.token
				// delete newPrams.loginTime
				// const str = qs.stringify(newPrams)
				// location.href = location.href.split('?')[0] + (str ? '?' + str : '')
				// return await this.checkToken()
			}
		} else {
			this.token = localStorage.getItem('token') || ''
			this.deviceId = localStorage.getItem('deviceId') || ''
			this.loginTime = Number(localStorage.getItem('loginTime') || '0')
			this.userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
		}
		// 没有token的时候
		if (!this.token) {
			// this.goSso(params)
			return
		} else {
			if (
				!(
					this.loginTime &&
					Math.floor(new Date().getTime() / 1000) +
						3600 * 24 * this.effectiveDays >=
						this.loginTime
				)
			) {
				this.clear()
				// 无效
				// this.goSso(params)
			} else {
				return (
					this.userAgent &&
					(await this.checkToken({
						token: this.token,
						userAgent: this.userAgent,
						deviceId: this.deviceId,
					}))
				)
			}
		}
		return (
			this.userAgent &&
			(await this.checkToken({
				token: this.token,
				userAgent: this.userAgent,
				deviceId: this.deviceId,
			}))
		)
	}
	public async checkToken(options: {
		token: string
		deviceId: string
		userAgent?: UserAgent
	}) {
		// console.log('checkToken，去后端获取UserInfo，并存储缓存')
		const res = await axios({
			method: 'GET',
			url: this.serverUrl + this.apiUrls.v1.prefix + this.apiUrls.v1.checkToken,
			// url: 'http://192.168.0.103:23160/api/v1/user/check',
			params: {
				appId: this.appId,
				token: options.token,
				deviceId: options.deviceId,
				userAgent: options.userAgent || this.userAgent,
			},
		})
		console.log('checkToken', res.data)
		if (res?.data?.code === 200) {
			// 需要存储进缓存
			this.userInfo = res?.data?.data?.userInfo
			this.token = res?.data?.data?.token
			this.deviceId = res?.data?.data?.deviceId

			return {
				token: this.token,
				userInfo: this.userInfo,
				deviceId: this.deviceId,
			}
		} else {
			this.token = ''
			this.loginTime = 0
			this.userInfo = {}
			return false
		}
	}
	goSso() {
		const params = qs.parse(window.location.search.split('?')[1])

		// 2、去SSO網站監測 有則返回
		const redirectUri = window.location.href
		delete params.token
		delete params.loginTime
		const newParams = {
			redirectUri: redirectUri.split('?')[0] + '?' + qs.stringify(params),
			appId: this.appId,
		}
		const loginUrl =
			this.clientUrl + '/loggingin' + '?' + qs.stringify(newParams)
		window.location.href = loginUrl
		// 3、去登錄
		// 4、返回數據
	}

	// anonymousUser: ReturnType<this['initAnonymousUser']>
	// initAnonymousUser() {
	// 	return {
	// 		// verifyAppToken: async (token?: string) => {
	// 		// 	// console.log('verifyAppToken,api', {
	// 		// 	// 	appId: this.appId,
	// 		// 	// 	appToken: token,
	// 		// 	// 	userAgent: this.userAgent,
	// 		// 	// })
	// 		// 	const res = await axios({
	// 		// 		method: 'POST',
	// 		// 		url:
	// 		// 			this.serverUrl +
	// 		// 			this.apiUrls.v1.prefix +
	// 		// 			this.apiUrls.v1.anonymousUserVerifyAppToken,
	// 		// 		data: {
	// 		// 			appId: this.appId,
	// 		// 			appToken: token,
	// 		// 			userAgent: this.userAgent,
	// 		// 		},
	// 		// 	})
	// 		// 	// console.log(res)
	// 		// 	if (res?.data?.code === 200 && res.data?.data?.token) {
	// 		// 		return res.data.data.token
	// 		// 	} else {
	// 		// 		return ''
	// 		// 	}
	// 		// },
	// 		// verifyUserToken: async ({
	// 		// 	appToken,
	// 		// 	token,
	// 		// 	deviceId,
	// 		// }: {
	// 		// 	appToken: string
	// 		// 	token: string
	// 		// 	deviceId: string
	// 		// }) => {
	// 		// 	const res = await axios({
	// 		// 		method: 'POST',
	// 		// 		url:
	// 		// 			this.serverUrl +
	// 		// 			this.apiUrls.v1.prefix +
	// 		// 			this.apiUrls.v1.anonymousUserVerifyToken,
	// 		// 		data: {
	// 		// 			appId: this.appId,
	// 		// 			appToken: appToken,
	// 		// 			token: token,
	// 		// 			deviceId: deviceId,
	// 		// 			userAgent: this.userAgent,
	// 		// 		},
	// 		// 	})
	// 		// 	// console.log('verifyUserToken', res.data)
	// 		// 	if (res?.data?.code === 200) {
	// 		// 		return {
	// 		// 			token: res.data.data.token,
	// 		// 			userInfo: res.data.data.userInfo,
	// 		// 			deviceId: res.data.data.deviceId,
	// 		// 		}
	// 		// 	} else if (res?.data?.code === 10029) {
	// 		// 		return 10029
	// 		// 	} else {
	// 		// 		return 10004
	// 		// 	}
	// 		// },
	// 	}
	// }
}

export { createLocalUser, getLocalUsers }

export default SakiSSOClient
