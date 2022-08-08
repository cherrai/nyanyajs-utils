import { NodeFsStorage } from './node'
export const electronRouter = (ipcMain: any) => {
	ipcMain.on(
		'NodeFsStoragerAPI',
		async (
			event: any,
			data: {
				requestId: string
				requestTime: number
				type: string
				label: string
				key: string
				value?: any
				options?: any
			}
		) => {
			let storage = NodeFsStorage.storages[data.label]
			// console.log('storage', storage)
			switch (data.type) {
				case 'set':
					event.sender.send('NodeFsStorageROUTER', {
						label: data.label,
						type: data.type,
						key: data.key,
						value: await storage?.set(data.key, data.value),
						requestId: data.requestId,
						requestTime: data.requestTime,
					})
					break
				case 'get':
					event.sender.send('NodeFsStorageROUTER', {
						label: data.label,
						type: data.type,
						key: data.key,
						value: await storage?.get(data.key),
						requestId: data.requestId,
						requestTime: data.requestTime,
					})
					break
				case 'getAll':
					event.sender.send('NodeFsStorageROUTER', {
						label: data.label,
						type: data.type,
						key: data.key,
						value: await storage?.getAll(),
						requestId: data.requestId,
						requestTime: data.requestTime,
					})
					break
				case 'delete':
					event.sender.send('NodeFsStorageROUTER', {
						label: data.label,
						type: data.type,
						key: data.key,
						value: await storage?.delete(data.key),
						requestId: data.requestId,
						requestTime: data.requestTime,
					})
					break
				case 'deleteAll':
					storage?.deleteAll()
					event.sender.send('NodeFsStorageROUTER', {
						label: data.label,
						type: data.type,
						key: data.key,
						requestId: data.requestId,
						requestTime: data.requestTime,
					})
					break
				case 'setLabel':
					storage = NodeFsStorage.storages[data.options?.oldLabel]

					storage?.setLabel(data.label)
					event.sender.send('NodeFsStorageROUTER', {
						label: data.label,
						type: data.type,
						key: data.key,
						requestId: data.requestId,
						requestTime: data.requestTime,
					})
					break

				case 'init':
					// 初始化
					// console.log('init', data.label, storage)
					// if (storage) return
					// storage = new NodeFsStorage<any>({
					// 	label: data.label,
					// 	cacheRootDir: NodeFsstorage.baseRootDir,
					// })
					// event.sender.send('NodeFsStorageROUTER', {
					// 	label: data.label,
					// 	type: data.type,
					// 	key: data.key,
					// 	value: true,
					// 	requestId: data.requestId,
					// 	requestTime: data.requestTime,
					// })
					break

				default:
					break
			}
		}
	)
}
