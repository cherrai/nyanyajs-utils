import parserFunc from 'ua-parser-js'
export interface UserAgent {
	browser: {
		name: string
		major: string
		version: string
	}
	device: {
		model: string
		type: string
		vendor: string
	}
	os: {
		name: string
		version: string
	}
	deviceName: string
}

export const userAgent = (ua: string): UserAgent => {
	const userAgent = parserFunc(ua)
	let deviceType = ''
	// electron env
	if (
		typeof window !== 'undefined' &&
		typeof window['electron'] !== 'undefined'
	) {
		deviceType = 'pc'
	}
	return {
		browser: {
			name: userAgent.browser.name || '',
			major: userAgent.browser.major || '',
			version: userAgent.browser.version || '',
		},
		os: {
			name: userAgent.os.name || '',
			version: userAgent.os.version || '',
		},
		device: {
			model: userAgent.device.model || '',
			type: deviceType || userAgent.device.type || 'browser',
			vendor: userAgent.device.vendor || '',
		},
		deviceName:
			userAgent.device.vendor + userAgent.device.model
				? userAgent.device.vendor + ' ' + userAgent.device.model
				: userAgent.browser.name || userAgent.os.name,
	}
}
export default userAgent
