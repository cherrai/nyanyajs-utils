import parserFunc from 'ua-parser-js'
export const userAgent = (ua: string) => {
	const userAgent = parserFunc(ua)

	const browser = (
		(userAgent.browser.name || '') +
		' ' +
		(userAgent.browser.version || '')
	).trim()

	const os = (
		(userAgent.os.name || '') +
		' ' +
		(userAgent.os.version || '')
	).trim()

	const device = (
		(userAgent.device.vendor || '') +
		' ' +
		(userAgent.device.model || '') +
		' ' +
		(userAgent.device.type || '')
	).trim()

	const deviceName = device || userAgent.browser.name || userAgent.os.name

	return {
		ua: { ...userAgent },
		browser,
		os,
		device,
		deviceName,
	}
}
export default userAgent
