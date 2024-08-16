// import { writeFile } from 'fs/promises'
// import { FFmpeg } from '@ffmpeg/ffmpeg'
// import { fetchFile, toBlobURL } from '@ffmpeg/util'
// import nyanyajs from 'nyanyajs-log'

// type ResizeOption = {
// 	// 如果宽度或者高度其中一个为不存在，则按照另外一个的像素等比例缩放
// 	// 如果都填写了，则按照新的像素拉伸缩放
// 	maxPixel?: number
// 	width?: number
// 	height?: number
// 	quality: number
// 	platform?: 'canvas' | 'wasm'
// }

// let ffmpeg: FFmpeg

// export const resize = async (file: File, options: ResizeOption) => {
// 	try {
// 		console.log(file)
// 		nyanyajs.info('videoresize', crossOriginIsolated, ffmpeg, 0)
// 		if (!ffmpeg) {
// 			const win = window as any
// 			// if (!crossOriginIsolated) {
// 			// 	console.log('crossOriginIsolated')
// 			// 	win.SharedArrayBuffer = win.ArrayBuffer
// 			// }
// 			console.log('win.SharedArrayBuffer', win.SharedArrayBuffer)
// 			ffmpeg = new FFmpeg()
// 			const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.1/dist/umd'
// 			ffmpeg.on('log', ({ type, message }: any) => {
// 				console.log(type, message)
// 			})
// 			ffmpeg.on('progress', ({ progress }: any) => {
// 				nyanyajs.info('progress', `${progress * 100} %`)
// 			})
// 			nyanyajs.info('videoresize', ffmpeg, 0)
// 			console.log(
// 				await ffmpeg.load({
// 					coreURL: await toBlobURL(
// 						`${baseURL}/ffmpeg-core.js`,
// 						'text/javascript'
// 					),
// 					wasmURL: await toBlobURL(
// 						`${baseURL}/ffmpeg-core.wasm`,
// 						'application/wasm'
// 					),
// 					workerURL: await toBlobURL(
// 						`${baseURL}/ffmpeg-core.worker.js`,
// 						'text/javascript'
// 					),
// 					thread: true,
// 				})
// 			)
// 			nyanyajs.info('videoresize', ffmpeg, 0)
// 			// ffmpeg = createFFmpeg({
// 			//   corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
// 			//   wasmPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm',
// 			//   workerPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js',

// 			//   log: true
// 			// })
// 		}
// 		const { name } = file
// 		nyanyajs.info(3, ffmpeg, name)
// 		await ffmpeg.writeFile(name, await fetchFile(file))
// 		nyanyajs.info(3, ffmpeg.loaded, name)
// 		console.log(await ffmpeg.exec(['-i', name, '-r', '20', 'output.mp4']))
// 		nyanyajs.info(4)
// 		const data = await ffmpeg.readFile('output.mp4')
// 		nyanyajs.info(5)
// 		nyanyajs.info(data)
// 		console.log(URL.createObjectURL(new Blob([data], { type: 'video/mp4' })))
// 	} catch (error) {
// 		console.error(error)
// 	}
// }

// export const videos = {
// 	resize,
// }

export {}
