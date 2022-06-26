import CryptoJS from 'crypto-js'

import axios from 'axios'

export const getHash = (result: string | ArrayBuffer) => {
	const r: any = result
	const wordArray = CryptoJS.lib.WordArray.create(r)
	const hash = CryptoJS.SHA256(wordArray).toString()
	return hash
}

export const api = {
	async uploadFile(
		apiUrl: string,
		token: string,
		blob: File,
		onUploadProgress: (progress: number) => void
	) {
		let formData = new FormData()
		formData.append('files', blob)
		return await axios.post(apiUrl + '?token=' + token, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			onUploadProgress: (e) => {
				if (e.lengthComputable) {
					onUploadProgress(((e.loaded / e.total) * 100) | 0)
				}
			},
		})
	},
}

// api.uploadFile(options.url, options.token)
// options.onprogress({
// 	uploadedSize: 3000,
// 	totalSize: options.file.size,
// })
// options.onsuccess({
// 	encryptionUrl: '',
// 	url: '',
// })
// options.onerror()
export const uploadFile = (options: {
	file: File
	url: string
	token: string
	chunkSize: number
	uploadedOffset: number[]
	onprogress: (options: { uploadedSize: number; totalSize: number }) => void
	onsuccess: (options: { encryptionUrl: string; url: string }) => void
	onerror: (err: string) => void
}) => {
	console.log('options', options)

	let offset = 0
	let chunkSize = options.chunkSize

	const reader = new FileReader()
	reader.onload = async (e) => {
		if (!e.target?.result) return

		const result: any = e.target?.result
		const hash = CryptoJS.SHA256(
			CryptoJS.lib.WordArray.create(result)
		).toString()
		const blob = new File(
			[e.target.result],
			encodeURIComponent(
				JSON.stringify({
					offset: offset.toString(),
					hash: hash,
					// 有问题
					final: e.total + offset === options.file.size ? 'ok' : 'no',
				})
			)
		)
		const res = await api.uploadFile(
			options.url,
			options.token,
			blob,
			(progress) => {
				options.onprogress({
					uploadedSize: offset + e.total * (progress / 100),
					totalSize: options.file.size,
				})
			}
		)
		if (res.data.code === 200) {
			// options.onprogress({
			// 	uploadedSize: e.total + offset,
			// 	totalSize: options.file.size,
			// })
			if (e.total + offset === options.file.size) {
				options.onsuccess({
					encryptionUrl: res.data.data.encryptionUrl,
					url: res.data.data.url,
				})
				return
			}
			offset = offset + chunkSize
			reader.readAsArrayBuffer(options.file.slice(offset, offset + chunkSize))
		} else {
			options.onerror(res.data.error)
		}
	}

	reader.readAsArrayBuffer(options.file.slice(offset, offset + chunkSize))
}
export default {
	getHash,
	uploadFile,
	api,
}
