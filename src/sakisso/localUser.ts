import { v4 } from 'uuid'
import { getShortId } from '../shortId'
import WebStorage from '../webStorage'
import userAgent, { UserAgent } from '../userAgent'
// 未来可和sso账户关联，现在不

export interface LocalUser {
	uid: string
	username: string
	nickname: string
	avatar: string
	createTime: number
	lastUpdateTime: number
	lastLoginTime: number
	deviceId: string
	userAgent: UserAgent
}

let storage = {
	localUser: new WebStorage<string, LocalUser>({
		storage: 'IndexedDB',
		baseLabel: 'sso-localUser',
	}),
}

export const createLocalUser = async ({
	nickname,
	avatar,
}: {
	nickname: string
	avatar: string
}) => {
	if (!nickname) {
		nickname = getShortId(10)
	}
	const localUser: LocalUser = {
		uid: getShortId(16),
		username: v4(),
		nickname,
		avatar,
		createTime: Math.floor(new Date().getTime() / 1000),
		lastUpdateTime: Math.floor(new Date().getTime() / 1000),
		lastLoginTime: Math.floor(new Date().getTime() / 1000),
		deviceId: v4(),
		userAgent: userAgent(window.navigator.userAgent),
	}

	await storage.localUser.set(localUser.uid, localUser)

	return localUser
}

export const setLocalUser = async (
	uid: string,
	user: {
		nickname?: string
		avatar?: string
		username?: string
	}
) => {
	return await storage.localUser.getAndSet(uid, async (val) => {
		if (!user.nickname) {
			user.nickname = getShortId(10)
		}
		if (!user.username) {
			user.username = val.username
		}
		return {
			...val,
			...user,
			userAgent: userAgent(window.navigator.userAgent),
			lastUpdateTime: Math.floor(new Date().getTime() / 1000),
		}
	})
}

export const loginLocalUser = async (uid: string) => {
	localStorage.setItem('loginLocalUser', uid)
	return await storage.localUser.getAndSet(uid, async (val) => {
		return {
			...val,
			userAgent: userAgent(window.navigator.userAgent),
			lastLoginTime: Math.floor(new Date().getTime() / 1000),
		}
	})
}
export const logoutLocalUser = () => {
	localStorage.removeItem('loginLocalUser')
}

export const getLoginLocalUser = async () => {
	const uid = localStorage.getItem('loginLocalUser')
	if (!uid) {
		return undefined
	}
	return await storage.localUser.get(uid)
}

export const deleteLocalUser = async (uid: string) => {
	return await storage.localUser.delete(uid)
}

export const getLocalUser = async (uid: string) => {
	return await storage.localUser.getAndSet(uid, async (val) => {
		return { ...val, userAgent: userAgent(window.navigator.userAgent) }
	})
}

export const getLocalUsers = async () => {
	const users = await storage.localUser.getAll()

	// console.log('users', users)

	users.sort((a, b) => b.value.lastUpdateTime - a.value.lastUpdateTime)

	const ua = userAgent(window.navigator.userAgent)

	const promiseAll: any[] = []

	users.forEach((v) => {
		v.value.userAgent = ua
		promiseAll.push(storage.localUser.set(v.key, v.value))
	})

	await Promise.all(promiseAll)

	return users.map((v) => {
		return v.value
	})
}
