import md5 from 'blueimp-md5'
import parser from 'ua-parser-js'

export const userAgent = parser(window.navigator.userAgent)

export const browser = (
	(userAgent.browser.name || '') +
	' ' +
	(userAgent.browser.version || '')
).trim()

export const os = (
	(userAgent.os.name || '') +
	' ' +
	(userAgent.os.version || '')
).trim()

export const device = (
	(userAgent.device.vendor || '') +
	' ' +
	(userAgent.device.model || '') +
	' ' +
	(userAgent.device.type || '')
).trim()

export const deviceName = device || userAgent.browser.name || userAgent.os.name

export default userAgent
