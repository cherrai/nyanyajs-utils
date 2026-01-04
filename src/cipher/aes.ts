import CryptoJS from 'crypto-js'

import AES from 'crypto-js/aes' //CFB模式
import CFB from 'crypto-js/mode-cfb' //CFB模式
import UTF8 from 'crypto-js/enc-utf8'
import Nopadding from 'crypto-js/pad-nopadding' //这里使输出HEX格式
// 加密函数

export const decrypt = (data: any, key: string, iv?: string) => {
  try {
    var reb64 = CryptoJS.enc.Hex.parse(data)
    var bytes = reb64.toString(CryptoJS.enc.Base64)
    // const newData = UTF8.parse(data)
    const newKey = UTF8.parse(key)
    const newIv = UTF8.parse(iv || key)

    var ciphertext = AES.decrypt(bytes, newKey, {
      iv: newIv,
      mode: CFB,
      padding: Nopadding,
    })
    return UTF8.stringify(ciphertext)
  } catch (error) {
    return ''
  }
}
export const encrypt = (data: any, key: string, iv?: string) => {
  const newData = UTF8.parse(JSON.stringify(data))
  const newKey = UTF8.parse(key)
  const newIv = UTF8.parse(iv || key)
  // 加密
  var ciphertext = AES.encrypt(newData, newKey, {
    iv: newIv,
    mode: CFB,
    padding: Nopadding,
  })
  return {
    ciphertext,
    value: ciphertext.ciphertext.toString(CryptoJS.enc.Hex), //这里返回的是HEX格式
  }
}
export default {
  decrypt,
  encrypt,
}
