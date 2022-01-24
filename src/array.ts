export const replaceItem = (arr: any[], index: number, item: any) => {
	arr.some((aIndex) => {
		if (index === aIndex) {
			arr[aIndex] = item
			return true
		}
	})
}
