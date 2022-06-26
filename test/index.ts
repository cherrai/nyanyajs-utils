import {
	debounce,
	userAgent,
	RSA,
	AES,
	dhkea,
	CipherSignature,
} from '../src/index'

function cipher() {
	const dhA = new dhkea.DHKea({
		bitLen: 1024,
	})
	const dhB = new dhkea.DHKea({
		bitLen: 1024,
	})
	const signA = dhA.getSharedKey(dhB.publicKey)
	const signB = dhB.getSharedKey(dhA.publicKey)
	console.log(signA)
	console.log(signB)
	console.log(signA === signB)
}
cipher()
