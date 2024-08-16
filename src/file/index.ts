import CryptoJS from 'crypto-js'

export interface FileInfo {
	name: string
	size: number
	type: string
	fileSuffix: string
	lastModified: number
	hash: string

	width: number
	height: number
}

// Maximum size 190MB
export const getHash = async (
	result: string | ArrayBuffer,
	type: 'SHA-1' | 'SHA-256' = 'SHA-256'
) => {
	// const r: any = result
	// const wordArray = CryptoJS.lib.WordArray.create(r)
	// const hash = CryptoJS.SHA256(wordArray).toString()
	// return hash

	// 支持sha-1 /sha-256
	let hash = await crypto.subtle.digest(type, result as any).then((a) =>
		Array.from(new Uint8Array(a))
			.map((a) => a.toString(16).padStart(2, '0'))
			.join('')
	)
	return hash
}

export const getFileInfo = (file: File): Promise<FileInfo | undefined> => {
	return new Promise((res, rej) => {
		try {
			let width = 0
			let height = 0
			const reader = new FileReader()

			reader.onload = async (e) => {
				if (!e.target?.result) {
					res(undefined)
					return
				}

				console.log('reader.onload', e)
				const hash = await getHash(e.target?.result, 'SHA-256')
				const fileInfo: FileInfo = {
					name: file.name,
					size: file.size,
					type: file.type,
					fileSuffix: file.name.split('.')?.[1] || '',
					lastModified: file.lastModified,
					hash: hash,

					width,
					height,
				}

				res(fileInfo)
			}

			if (file.type.indexOf('image') >= 0) {
				let img = new Image()
				img.src = URL.createObjectURL(file)

				img.onerror = () => {
					res(undefined)
				}
				if (img.complete) {
					width = img.width
					height = img.height
					reader.readAsArrayBuffer(file)
				} else {
					// 加载完成执行
					img.onload = () => {
						width = img.width
						height = img.height
						reader.readAsArrayBuffer(file)
					}
				}
				return
			}
			reader.readAsArrayBuffer(file)
		} catch (error) {
			rej(error)
		}
	})
}

export const file = {
	getHash,
	getFileInfo,
}
