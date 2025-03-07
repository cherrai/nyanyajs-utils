import md5 from "blueimp-md5"

let cvs: HTMLCanvasElement


export type RgbaRange = (number[])[]

export const imageColorInversionUsingCanvas = async (
  cvs: HTMLCanvasElement,
  rgbaRanges: RgbaRange[], toRgba: number[]) => {
  return new Promise<ImageData>(async (res, rej) => {
    try {
      let ctx = cvs.getContext('2d')

      const w = cvs.width
      const h = cvs.height

      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, w, h)

      if (!rgbaRanges.length || toRgba.length < 4) {
        res(imageData)
        return
      }

      // console.log('hextrue', rgbaRange, toRgba, imageData.data.length / 4)
      for (let i = 0; i < imageData.data.length / 4; i++) {
        // const element = array[i];
        const v = imageData.data
        // // console.log(i * 4)

        const rgba = [
          v[i * 4],
          v[i * 4 + 1],
          v[i * 4 + 2],
          v[i * 4 + 3],
        ]
        // 246, 228, 164
        // 229, 197, 81
        // 238, 210, 115
        // 246, 235, 200

        // rgba[0] >= 180 &&
        // rgba[0] <= 255 &&
        // rgba[1] >= 90 &&
        // rgba[1] <= 228 &&
        // rgba[2] >= 16 &&
        // rgba[2] <= 165

        rgbaRanges.forEach(rgbaRange => {
          if (
            rgba[0] >= rgbaRange[0][0] &&
            rgba[0] <= rgbaRange[0][1] &&
            rgba[1] >= rgbaRange[1][0] &&
            rgba[1] <= rgbaRange[1][1] &&
            rgba[2] >= rgbaRange[2][0] &&
            rgba[2] <= rgbaRange[2][1] &&
            rgba[3] >= Math.round(rgbaRange[3][0] * 255) &&
            rgba[3] <= Math.round(rgbaRange[3][1] * 255)
          ) {
            // const hex = rgbHex(
            //   rgba
            //     .filter((v, i) => {
            //       return i < 3
            //     })
            //     .join(',')
            // )
            // // console.log('hextrue', rgba, rgba)

            imageData.data[i * 4] = toRgba[0]
            imageData.data[i * 4 + 1] = toRgba[1]
            imageData.data[i * 4 + 2] = toRgba[2]
            imageData.data[i * 4 + 3] = Math.round(toRgba[3] * 255)
          }
        })

        // if (hex === 'f9bc6c') {
        // 	// console.log('hextrue', hex)
        // }
      }

      res(imageData)
    } catch (error) {
      rej(error)
    }
  })
}

let dataMap: {
  [k: string]: ImageColorInversionResult
} = {}

export type ImageColorInversionResult = {
  blob: Blob,
  imageData: ImageData
  objectURL: string
} | undefined


export const imageColorInversion = async ({
  imgEl, imgSrc
}: {
  imgEl?: HTMLImageElement
  imgSrc?: string
}, rgbaRanges: RgbaRange[], toRgba: number[]) => {
  return new Promise<ImageColorInversionResult>(async (res, rej) => {
    try {
      if ((!imgEl && !imgSrc)) return res(undefined)
      const src = imgEl?.src || imgSrc || ""
      const imageEl: HTMLImageElement = imgEl || document.createElement("img")

      const k = md5(JSON.stringify({
        src,
        rgbaRanges,
        toRgba
      }))

      // // console.log("imageColorInversiondataMap", dataMap[k], k)
      if (dataMap[k]) {
        res(dataMap[k])
        return
      }

      if (!imgEl) {
        imageEl.src = src
        return await imageColorInversion({ imgEl: imageEl }, rgbaRanges, toRgba)
      }

      // if (colorInversionMap[src]) {
      //   res(colorInversionMap[src])
      //   return
      // }
      if (!cvs) {
        cvs = document.createElement("canvas")
        cvs.style.display = "none"
        document.body.appendChild(cvs)
      }
      let ctx = cvs.getContext('2d')
      let w = imageEl.width
      let h = imageEl.height
      cvs.width = w
      cvs.height = h

      if (!ctx) return


      // // console.log('colorInversion', imgEl, cvs, ctx, imgEl.width, imgEl.height)

      // drawRoundedRect(ctx, 0, 0, w, h, 14)

      // console.log("imageEl", imageEl, ctx, w, h)

      ctx?.drawImage(imageEl, 0, 0, w, h)

      const imageData = await imageColorInversionUsingCanvas(cvs, rgbaRanges, toRgba)

      ctx.putImageData(imageData, 0, 0)


      // return cvs?.toDataURL('image/jpg', 1)
      cvs?.toBlob((blob) => {
        if (!blob) return
        // colorInversionMap[src] = b
        const result = {
          blob,
          imageData,
          objectURL: URL.createObjectURL(blob)
        }
        res(result)

        dataMap[k] = result

      }, 'image/jpg', 1)
    } catch (error) {
      rej(error)
    }
  })
}


export default { imageColorInversion }