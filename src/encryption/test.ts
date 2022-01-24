// import { RSAKey, KEYUTIL, KJUR, b64tohex, hextob64 } from 'jsrsasign'
// import { getRsaKey, getSign, verifySign } from './rsa'
// // const { createDiffieHellman } = require('diffie-hellman/browser')
// // var crypto = require('crypto-browserify')
// // var crypto = require('diffie-hellman/browser')
// // var crypto = require('diffie-hellman/browser')
// // import { DiffieHellman, createDiffieHellman } from 'crypto-ts'
// // import {
// // 	atan2,
// // 	chain,
// // 	derivative,
// // 	e,
// // 	evaluate,
// // 	log,
// // 	pi,
// // 	pow,
// // 	round,
// // 	sqrt,
// // } from 'mathjs'
// import { DiffieHellman } from './diffie-hellman'

// var BigNumber = require('big-number')

// BigNumber.prototype.clean = function () {
// 	// used to make the value of BigNumber()'s more eye friendly
// 	var total = ''
// 	for (var i = 0; i < this.number.length; i++) {
// 		total += this.number[this.number.length - (i + 1)]
// 	}
// 	return total
// }

// function random(min: number, max: number) {
// 	var newMin = min || 0
// 	var newMax = max || 10
// 	return min !== undefined && max !== undefined
// 		? Math.floor(Math.random() * (newMax - newMin) + newMin)
// 		: Math.floor(Math.random() * 10)
// }

// const init = () => {
// 	console.time('开始签名')
// 	// const serverDh = new DiffieHellman()
// 	// const clientDh = new DiffieHellman({
// 	// 	prime: serverDh.prime,
// 	// 	base: serverDh.base,
// 	// 	publicKey: {
// 	// 		outside: serverDh.publicKey.inside,
// 	// 	},
// 	// })
// 	// clientDh.generateSecretKey()
// 	// serverDh.generateSecretKey(clientDh.publicKey.inside)
// 	// console.log('serverDh ', serverDh)
// 	// console.log('clientDh ', clientDh)

// 	// console.log('key ', dh.generateSecretKey())
// 	// let data = encrypt('sa', dh.generateSecretKey(), 'sa')
// 	// console.log('data', data)
// 	// console.log(decrypt(data, dh.generateSecretKey(), 'sa'))
// 	// AES算法
// 	// const prime = 6551678623768550
// 	// const base = 3254834793529522
// 	// const aSecret = 45
// 	// const bSecret = 40
// 	// console.log(prime, base, aSecret)
// 	// // Alice Sends Bob A = g^a mod p
// 	// var A = new BigNumber(base).pow(aSecret).mod(prime)
// 	// console.log('\n  Alice Sends Over Public Chanel: ', A.clean())

// 	// // Bob Sends Alice B = g^b mod p
// 	// var B = new BigNumber(base).pow(bSecret).mod(prime)
// 	// console.log('  Bob Sends Over Public Chanel: ', B.clean())

// 	// console.log('\n------------\n')
// 	// console.log('Privately Calculated Shared Secret:')
// 	// var aliceSharedSecret = B.pow(aSecret).mod(prime) // Alice Computes Shared Secret: s = B^a mod p
// 	// console.log('    Alice Shared Secret: ', aliceSharedSecret.clean())

// 	// console.log(A.clean())
// 	// var bobSharedSecret = A.pow(bSecret).mod(prime) // Bob Computes Shared Secret: s = A^b mod p
// 	// console.log('    Bob Shared Secret: ', bobSharedSecret.clean())
// 	// 1、服务端生成RSA公钥和私钥，存储私钥到缓存，
// 	// 有效期5分钟。将公钥给客户端。
// 	// const { privateKey, publicKey } = getRsaKey()

// 	// const sign = getSign(privateKey, publicKey)
// 	// console.log('getSign: ', sign)
// 	// console.log('verifySign: ', verifySign(publicKey, publicKey, sign))

// 	// var primeLength = 1024 // 素数p的长度
// 	// var generator = 5 // 素数a

// 	// 创建客户端的DH实例

// 	// 2、客户端拿到服务端RSA公钥后，生成自己的
// 	// RSA公钥和私钥，并用服务端RSA公钥加密客户
// 	// 端公钥传给服务端。有效期5分钟。

// 	// 3、服务端通过DH算法将生成的PGA，并且再生
// 	// 成一个用于二次加密的二次Key。用客户端公钥
// 	// 加密后传给客户端。
// 	// p为16位质数

// 	// 4、客户端用服务端的PGA利用DH算法，生成
// 	// AES Key和自己的PGA，再通过客户端RSA公钥
// 	// 将客户端的PGA加密传给服务端。此时的AES Key
// 	// 混淆一下，并通过之前服务端的二次Key进行加密
// 	// 后作为真正的AES Key。

// 	// 5、服务端拿到的客户端PGA生成同样的AES Key
// 	// 之后，Redis缓存5分钟。此时的AES Key混淆
// 	// 一下，并通过之前服务端的二次Key进行加密后作
// 	// 为真正的AES Key。互相就用这个加密和解密请
// 	// 求响应热数据。

// 	// 6、在未登录的时候。因为没有token，可以直接
// 	// 走上面的流程。但是登录的时候需要有AES Key加
// 	// 密的password作为自定义条件获取token。
// 	// 7、除了登录请求外，其他的请求都必须由token
// 	// 通过认证且由其包含作为key加密后才能进行请求。
// 	// 譬如第一次生成客户端公钥私钥，需要包含token
// 	// 里面解析出来的随机数据。且token必须有效。
// 	console.timeEnd('开始签名')
// }

// export default init
