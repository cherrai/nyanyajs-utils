import qs from 'qs'
import axios from 'axios'
import { UserAgent } from '../userAgent'

export class SakiSSOClient {
	appId: string = ''
	// appKey: string = ''
	token: string = ''
	deviceId: string = ''
	ssoUrl: string = ''
	ssoApiUrl: string = ''
	loginTime: number = 0
	userInfo: any = {}
	effectiveDays: number = 21
	userAgent?: UserAgent
	constructor({
		appId,
		// appKey,
		ssoUrl,
		userAgent,
		ssoApiUrl,
	}: {
		appId: string
		// appKey: string
		ssoUrl: string
		ssoApiUrl: string
		userAgent: UserAgent
	}) {
		// console.log(appId, appKey, ssoUrl)
		appId && (this.appId = appId)
		// appKey && (this.appKey = appKey)
		ssoUrl && (this.ssoUrl = ssoUrl)
		ssoApiUrl && (this.ssoApiUrl = ssoApiUrl)
		userAgent && (this.userAgent = userAgent)
	}
	logout() {
		this.clear()
		// 去SSO删除token
		const loginUrl = this.ssoUrl + '/logout'
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
		const params = qs.parse(location.search.split('?')[1])

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
	async checkToken(options: {
		token: string
		userAgent: UserAgent
		deviceId: string
	}) {
		// console.log('checkToken，去后端获取UserInfo，并存储缓存')
		const res = await axios({
			method: 'GET',
			url: this.ssoApiUrl + '/api/v1/user/check',
			// url: 'http://192.168.0.103:23160/api/v1/user/check',
			params: {
				appId: this.appId,
				token: options.token,
				userAgent: options.userAgent,
				deviceId: options.deviceId,
			},
		})
		// console.log('checkToken', res.data)
		if (res?.data?.code === 200) {
			// 需要存储进缓存
			this.userInfo = res?.data?.data?.userInfo
			this.token = res?.data?.data?.token
			this.deviceId = res?.data?.data?.deviceId

			localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
			return {
				token: this.token,
				userInfo: this.userInfo,
				deviceId: this.deviceId,
			}
		} else {
			this.token = ''
			this.loginTime = 0
			this.userInfo = {}
			localStorage.removeItem('loginTime')
			localStorage.removeItem('token')
			localStorage.removeItem('userInfo')
			return false
		}
	}
	goSso() {
		const params = qs.parse(location.search.split('?')[1])

		// 2、去SSO網站監測 有則返回
		const redirectUri = location.href
		delete params.token
		delete params.loginTime
		const newParams = {
			redirectUri: redirectUri.split('?')[0] + '?' + qs.stringify(params),
			appId: this.appId,
		}
		const loginUrl = this.ssoUrl + '/loggingin' + '?' + qs.stringify(newParams)
		location.href = loginUrl
		// 3、去登錄
		// 4、返回數據
	}
}

export default SakiSSOClient
