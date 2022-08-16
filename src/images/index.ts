import EXIF from 'exif-js'

type ExifType = {
	Orientation: number
	ImageHeight: number
	ImageWidth: number
	Model: string
}
export const getExif = (file: File) => {
	return new Promise<ExifType>(function (resolve, reject) {
		// const fileReader = new FileReader()
		// fileReader.onload = async (e) => {
		// 	// console.log(e.target.result)
		// 	const result: any = e.target?.result
		// 	// console.log(exif)
		const img: any = document.createElement('img')
		img.src = URL.createObjectURL(file)
		const timer = setTimeout(() => {
			resolve({
				Orientation: 1,
				ImageWidth: img.width,
				ImageHeight: img.height,
				Model: '',
			})
		}, 1000)
		img.onload = () => {
			EXIF.getData(img, function () {
				var tags = EXIF.getAllTags(img)
				resolve(tags)
				clearTimeout(timer)
			})
		}
		// }
		// fileReader.readAsDataURL(file)
	})
}
export const resize = async (
	file: File,
	options: {
		// 如果宽度或者高度其中一个为不存在，则按照另外一个的像素等比例缩放
		// 如果都填写了，则按照新的像素拉伸缩放
		maxPixel?: number
		width?: number
		height?: number
		quality: number
		exif?: ExifType
	}
) => {
	if (options.maxPixel) {
		// console.log(file, options)
		if (!file) {
			console.error('file does not exist')
			return
		}

		// 改变图片的src
		const exif = await getExif(file)

		return await convert(file, {
			maxPixel: options.maxPixel,
			quality: options.quality,
			exif,
		})
	}
	return await convert(file, {
		width: options.width,
		height: options.height,
		quality: options.quality,
	})
}

export const convert = (
	file: File,
	options: {
		// 如果宽度或者高度其中一个为不存在，则按照另外一个的像素等比例缩放
		// 如果都填写了，则按照新的像素拉伸缩放
		maxPixel?: number
		width?: number
		height?: number
		quality: number
		exif?: ExifType
	}
) => {
	return new Promise<{
		dataURL: string
		blob: Blob
		file: File
	}>(async (resolve, reject) => {
		try {
			var tempImg = document.createElement('img')
			// 解决跨域
			tempImg.setAttribute('crossOrigin', 'anonymous')
			tempImg.src = URL.createObjectURL(file)
			// 创建cvs
			var cvs = document.createElement('canvas')
			var ctx = cvs.getContext('2d')

			var cvsWidth = null
			var cvsHeight = null
			var tempNum = null

			tempImg.onload = async () => {
				const exif = options?.exif || (await getExif(file))
				// 加载完毕后再玩
				let maxPixel = options.maxPixel
				// if (!options.width || !options.height) {
				// 	maxPixel = options.width || options.height
				// }
				// console.log('maxPixel', maxPixel)

				let imgType = 'image/jpeg'

				if (maxPixel) {
					// 设置cvs的宽高
					// console.log(tempImg.naturalHeight,tempImg.naturalWidth);
					// 只限制宽度、如果宽度低于最大宽度、那么原图分辨率显示
					if (tempImg.naturalWidth > tempImg.naturalHeight) {
						cvsWidth = maxPixel
						cvsHeight =
							(tempImg.naturalHeight / tempImg.naturalWidth) * maxPixel
					} else {
						cvsWidth = (tempImg.naturalWidth / tempImg.naturalHeight) * maxPixel
						cvsHeight = maxPixel
					}

					// if (tempImg.naturalWidth > tempImg.naturalHeight) {
					//   cvsWidth = data.maxPixel;
					//   cvsHeight =
					//     (tempImg.naturalHeight / tempImg.naturalWidth) * data.maxPixel;
					// } else {
					//   cvsHeight = data.maxPixel;
					//   cvsWidth =
					//     (tempImg.naturalWidth / tempImg.naturalHeight) * data.maxPixel;
					// }

					// undefined是非摄影设备拍的、1则是正确方向
					// console.log(exif, exif.Orientation, cvsWidth, cvsHeight)
					// cvs.style.marginTop = '300px'
					// document.body.appendChild(cvs)
					// if (exif?.Orientation !== undefined && exif?.Orientation !== 1) {
					// 	switch (exif?.Orientation) {
					// 		case 6: //需要顺时针（向左）90度旋转
					// 			cvs.width = cvsHeight
					// 			cvs.height = cvsWidth
					// 			ctx?.translate(cvsHeight, 0)
					// 			ctx?.rotate(Math.PI / 2)
					// 			ctx?.drawImage(tempImg, 0, 0, cvsWidth, cvsHeight)

					// 			// 换一下位置
					// 			tempNum = cvsHeight
					// 			cvsHeight = cvsWidth
					// 			cvsWidth = tempNum
					// 			break
					// 		case 8: //需要逆时针（向右）90度旋转
					// 			cvs.width = cvsHeight
					// 			cvs.height = cvsWidth
					// 			ctx?.translate(0, cvsWidth)
					// 			ctx?.rotate(-Math.PI / 2)
					// 			ctx?.drawImage(tempImg, 0, 0, cvsWidth, cvsHeight)

					// 			// 换一下位置
					// 			tempNum = cvsHeight
					// 			cvsHeight = cvsWidth
					// 			cvsWidth = tempNum
					// 			break
					// 		case 3: //需要180度旋转
					// 			cvs.width = cvsWidth
					// 			cvs.height = cvsHeight
					// 			ctx?.translate(cvsWidth, cvsHeight)
					// 			ctx?.rotate((Math.PI / 2) * 2)
					// 			ctx?.drawImage(tempImg, 0, 0, cvsWidth, cvsHeight)
					// 			break
					// 	}
					// }
					// 正常的显示
					cvs.width = cvsWidth
					cvs.height = cvsHeight
					ctx?.drawImage(tempImg, 0, 0, cvsWidth, cvsHeight)
				} else {
					if (!options.width && !options.height) {
						return reject('width or height does not exist')
					}
					if (!options.width) {
						options.width =
							(tempImg.naturalWidth / tempImg.naturalHeight) *
							Number(options.height)
					}
					if (!options.height) {
						options.height =
							(tempImg.naturalHeight / tempImg.naturalWidth) * options.width
					}
					// console.log(options.width)
					// console.log(options.height)

					cvsWidth = options.width
					cvsHeight = options.height

					cvs.width = cvsWidth
					cvs.height = cvsHeight
					ctx?.drawImage(tempImg, 0, 0, cvsWidth, cvsHeight)
				}

				cvs.toBlob(
					(blob) => {
						const cFile = new File([blob], file.name, {
							type: file.type,
						})
						resolve({
							dataURL: cvs.toDataURL(imgType, options.quality),
							blob,
							file: cFile,
						})
					},
					imgType,
					options.quality
				)
			}
		} catch (error) {
			reject(error)
		}
	})
}

export const images = {
	getExif,
	resize,
}
