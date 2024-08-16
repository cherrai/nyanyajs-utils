import md5 from 'blueimp-md5'
import { getRandomNum } from '../nnumber'

export const getRandomKey = () => {
	return md5(getRandomNum(16) + 'nyanya')
}

