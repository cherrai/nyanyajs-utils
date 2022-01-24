// let timer: number;
let debounceHandlers: {
	timer: any
	func: Function
	delaytime: number
	key: string
}[] = []
export const debounce = (
	func: () => void,
	delaytime: number,
	key: string = 'debounce'
) => {
	let handlerIndex = -1
	debounceHandlers.some((item, index) => {
		if (item.key === key && item.delaytime === delaytime) {
			handlerIndex = index
			return true
		}
	})
	if (handlerIndex >= 0) {
		clearTimeout(debounceHandlers[handlerIndex].timer)
		debounceHandlers.splice(handlerIndex, 1)
	}
	debounceHandlers.push({
		timer: setTimeout(() => {
			func()
			debounceHandlers.some((item, index) => {
				if (item.key === key && item.delaytime === delaytime) {
					debounceHandlers.splice(index, 1)
					return true
				}
			})
		}, delaytime),
		func: func,
		delaytime,
		key,
	})
}

export default debounce
