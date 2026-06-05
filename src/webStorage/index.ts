// import { NyaNyaDB, IndexedDB } from './nyanyadb'
import { NyaNyaDB, IndexedDB } from '@nyanyajs/nyanyadb'
import md5 from 'blueimp-md5'
// import QueueLoop from '../queueloop'
import { AsyncQueue } from '../asyncQueue'
// import { AsyncQueue } from '@nyanyajs/utils'

export interface StorageOptions {
  storage?: 'LocalStorage' | 'IndexedDB' | 'ElectronNodeFsStorage'
  baseLabel: string
  encryption?: {
    enable: boolean
    key?: string
  }
  cleanup?: {
    enable?: boolean
    interval?: number // 清理间隔（毫秒），默认 1 小时
  }
}
export interface Value<T> {
  value: T
  expiration: number
}
export interface NyaNyaDBStorageSchema {
  key: string
  data: string
  options: string
  label: string
}

// console.log('WebStorageWebStorage')

const nyanyadb = new NyaNyaDB({
  databaseName: 'WebStorage',
  version: 1,
})

const model = nyanyadb.CreateModel(
  new NyaNyaDB.Schema<NyaNyaDBStorageSchema>({
    id: {
      type: Number,
      primaryKey: true,
      createIndex: true,
      autoIncrement: true,
    },
    key: {
      type: String,
      required: true,
      createIndex: true,
    },
    data: {
      type: String,
      required: true,
    },
    options: {
      type: String,
      default: '{}',
    },
    label: {
      type: String,
      required: true,
      createIndex: true,
    },
  }),
  'storage'
)

interface StorageStrategy<K = string, T = any> {
  get(key: K, webStorage: WebStorage<K, T>): Promise<T>
  getSync(key: K, webStorage: WebStorage<K, T>): T
  getAndSet(
    key: K,
    func: (value: T) => Promise<T>,
    webStorage: WebStorage<K, T>
  ): Promise<T>
  mget(keys: K[], webStorage: WebStorage<K, T>): Promise<{ key: K; value: T }[]>
  getAll(webStorage: WebStorage<K, T>): Promise<{ key: K; value: T }[]>
  getAllSync(webStorage: WebStorage<K, T>): { key: K; value: T }[]
  set(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): Promise<boolean>
  mset(
    params: { key: K; value: T; expiration: number }[],
    webStorage: WebStorage<K, T>
  ): Promise<void>
  setSync(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): boolean
  delete(key: K, webStorage: WebStorage<K, T>): Promise<void>
  mdelete(keys: K[], webStorage: WebStorage<K, T>): Promise<void>
  deleteAll(webStorage: WebStorage<K, T>): void
  setLabel(label: string, webStorage: WebStorage<K, T>): void
  cleanupExpired(webStorage: WebStorage<K, T>): Promise<number> // 清理过期数据，返回清理的数量
}

class LocalStorageStrategy<K = string, T = any> implements StorageStrategy<
  K,
  T
> {
  async get(key: K, webStorage: WebStorage<K, T>): Promise<T> {
    return webStorage.getSync(key)
  }

  getSync(key: K, webStorage: WebStorage<K, T>): T {
    if (!key) {
      return webStorage.undefinedValue()
    }
    const k = webStorage.getKey(key)
    try {
      const v = localStorage.getItem(k)
      if (!v) {
        return webStorage.undefinedValue()
      }
      const vObj: Value<T> = JSON.parse(v)
      if (!vObj?.value) {
        return webStorage.undefinedValue()
      }
      if (vObj.expiration === -1) {
        return vObj.value
      } else {
        if (vObj.expiration >= new Date().getTime()) {
          return vObj.value
        } else {
          this.delete(key, webStorage)
          return webStorage.undefinedValue()
        }
      }
    } catch (error) {
      console.error(error)
      return webStorage.undefinedValue()
    }
  }

  async getAndSet(
    key: K,
    func: (value: T) => Promise<T>,
    webStorage: WebStorage<K, T>
  ): Promise<T> {
    const v = await this.get(key, webStorage)
    const nv = await func(v)
    await this.set(key, nv, 0, webStorage)
    return nv
  }

  async mget(
    keys: K[],
    webStorage: WebStorage<K, T>
  ): Promise<{ key: K; value: T }[]> {
    return []
  }

  async getAll(webStorage: WebStorage<K, T>): Promise<{ key: K; value: T }[]> {
    return []
  }

  getAllSync(webStorage: WebStorage<K, T>): { key: K; value: T }[] {
    console.error('LocalStorage does not support functions')
    return []
  }

  async set(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): Promise<boolean> {
    return webStorage.setSync(key, value, expiration)
  }

  async mset(
    params: { key: K; value: T; expiration: number }[],
    webStorage: WebStorage<K, T>
  ): Promise<void> {
    for (let i = 0; i < params.length; i++) {
      const v = params[i]
      await this.set(v.key, v.value, v.expiration || 0, webStorage)
    }
  }

  setSync(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): boolean {
    if (!key) return false
    const k = webStorage.getKey(key)
    const vObj = webStorage.getValue(value, expiration * 1000)
    localStorage.setItem(k, vObj.toString())
    webStorage.keys = webStorage.keys.filter((v) => {
      return v != key
    })
    webStorage.keys.push(key)
    webStorage.updateKeys()
    return true
  }

  async delete(key: K, webStorage: WebStorage<K, T>): Promise<void> {
    if (!key) return
    const k = webStorage.getKey(key)
    delete webStorage.map[k]
    localStorage.removeItem(k)
    webStorage.keys = webStorage.keys.filter((v) => {
      return v != key
    })
    webStorage.updateKeys()
  }

  async mdelete(keys: K[], webStorage: WebStorage<K, T>): Promise<void> {
    for (let i = 0; i < keys.length; i++) {
      const v = keys[i]
      await this.delete(v, webStorage)
    }
  }

  deleteAll(webStorage: WebStorage<K, T>): void {
    webStorage.map = {}
    webStorage.keys.forEach((v) => {
      const k = webStorage.getKey(v)
      localStorage.removeItem(k)
    })
    webStorage.keys = []
    webStorage.updateKeys()
  }

  setLabel(label: string, webStorage: WebStorage<K, T>): void {
    webStorage.initKeys()
  }

  async cleanupExpired(webStorage: WebStorage<K, T>): Promise<number> {
    let cleanedCount = 0
    const now = new Date().getTime()

    // 遍历所有 localStorage 项，查找属于当前 label 的过期数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      try {
        const parsedKey = JSON.parse(key)
        // 只处理属于当前 label 的数据
        if (parsedKey.label !== webStorage.label) continue

        const value = localStorage.getItem(key)
        if (!value) continue

        const vObj: Value<T> = JSON.parse(value)
        // 检查是否过期（-1 表示永久不过期）
        if (vObj.expiration !== -1 && vObj.expiration < now) {
          localStorage.removeItem(key)
          delete webStorage.map[key]
          cleanedCount++
        }
      } catch {
        // 忽略解析失败的项
        continue
      }
    }

    // 更新 keys 数组
    if (cleanedCount > 0) {
      webStorage.keys = webStorage.keys.filter((k) => {
        const fullKey = webStorage.getKey(k)
        return localStorage.getItem(fullKey) !== null
      })
      webStorage.updateKeys()
    }

    return cleanedCount
  }
}

class IndexedDBStrategy<K = string, T = any> implements StorageStrategy<K, T> {
  async get(key: K, webStorage: WebStorage<K, T>): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      try {
        if (!key) {
          resolve(webStorage.undefinedValue())
          return
        }
        const k = webStorage.getKey(key)
        WebStorage.model
          .Find({
            label: {
              $value: webStorage.label,
            },
            key: {
              $value: k,
            },
          })
          .Result()
          .then(async (v: any) => {
            if (!v.length) {
              resolve(webStorage.undefinedValue())
              return
            }
            const vObj: Value<T> = JSON.parse(v[v.length - 1].data)
            if (!vObj) {
              return webStorage.undefinedValue()
            }
            if (vObj.expiration === -1) {
              resolve(vObj.value)
              return
            } else {
              if (vObj.expiration >= new Date().getTime()) {
                resolve(vObj.value)
                return
              } else {
                this.delete(key, webStorage)
                resolve(webStorage.undefinedValue())
                return
              }
            }
          })
          .catch((err) => {
            console.log(err)
            resolve(webStorage.undefinedValue())
          })
      } catch (error) {
        console.error(error)
        return reject(webStorage.undefinedValue())
      }
    })
  }

  getSync(key: K, webStorage: WebStorage<K, T>): T {
    if (!key) {
      return webStorage.undefinedValue()
    }
    const k = webStorage.getKey(key)
    this.get(key, webStorage).then((val) => {
      if (val) {
        webStorage.map[k] = val
      }
      webStorage.map[k] = val
    })
    return webStorage.map[k] || webStorage.undefinedValue()
  }

  async getAndSet(
    key: K,
    func: (value: T) => Promise<T>,
    webStorage: WebStorage<K, T>
  ): Promise<T> {
    const v = await this.get(key, webStorage)
    const nv = await func(v)
    await this.set(key, nv, 0, webStorage)
    return nv
  }

  async mget(
    keys: K[],
    webStorage: WebStorage<K, T>
  ): Promise<{ key: K; value: T }[]> {
    return new Promise<{ key: K; value: T }[]>(async (resolve, reject) => {
      try {
        WebStorage.model
          .Find({
            label: {
              $value: webStorage.label,
            },
            key: {
              $in: keys,
            },
          })
          .Result()
          .then((res) => {
            const list = res.map((v) => {
              const vObj: Value<T> = JSON.parse(v.data)
              return {
                key: webStorage.getOriginalKey(v.key),
                value: vObj.value,
              }
            })
            resolve(list)
          })
          .catch((err) => {
            console.log(err)
            resolve(webStorage.undefinedValue())
          })
      } catch (error) {
        console.error(error)
        return reject(webStorage.undefinedValue())
      }
    })
  }

  async getAll(webStorage: WebStorage<K, T>): Promise<{ key: K; value: T }[]> {
    return new Promise<{ key: K; value: T }[]>(async (resolve, reject) => {
      try {
        WebStorage.model
          .Find({
            label: {
              $value: webStorage.label,
            },
          })
          .Result()
          .then((res) => {
            const list = res?.map((v) => {
              const vObj: Value<T> = JSON.parse(v.data)
              return {
                key: webStorage.getOriginalKey(v.key),
                value: vObj.value,
              }
            })
            resolve(list)
          })
          .catch((err) => {
            console.log(err)
            resolve(webStorage.undefinedValue())
          })
      } catch (error) {
        console.error(error)
        return reject(webStorage.undefinedValue())
      }
    })
  }

  getAllSync(webStorage: WebStorage<K, T>): { key: K; value: T }[] {
    try {
      const keys = Object.keys(webStorage.map)
      if (keys.length) {
        return keys.map((k) => {
          return {
            key: webStorage.getOriginalKey(k),
            value: webStorage.map[k],
          }
        })
      }
      this.getAll(webStorage)
        .then((list) => {
          list.forEach((v) => {
            webStorage.map[v.key as any] = v.value
          })
        })
        .catch((err) => {
          console.error(err)
        })
      return []
    } catch (error) {
      console.error(error)
      return []
    }
    return []
  }

  async set(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      if (!key) return resolve(false)
      webStorage.asyncQueue.increase(async () => {
        try {
          const k = webStorage.getKey(key)
          const getValue = await this.get(key, webStorage)
          const vObj = webStorage.getValue(value, expiration * 1000)
          if (!getValue) {
            new WebStorage.model({
              key: k,
              data: vObj.toString(),
              options: JSON.stringify({}),
              label: webStorage.label,
            })
              .Save()
              .then((res) => {
                resolve(true)
              })
              .catch((err: any) => {
                console.log(err)
                resolve(false)
              })
          } else {
            WebStorage.model
              .Update(
                {
                  label: {
                    $value: webStorage.label,
                  },
                  key: {
                    $value: k,
                  },
                },
                {
                  data: vObj.toString(),
                  options: JSON.stringify({}),
                }
              )
              .then((res: any) => {
                resolve(true)
              })
              .catch((err: any) => {
                resolve(false)
              })
          }
        } catch (error) {
          console.error(error)
          return reject(webStorage.undefinedValue())
        }
      })
    })
  }

  async mset(
    params: { key: K; value: T; expiration: number }[],
    webStorage: WebStorage<K, T>
  ): Promise<void> {
    for (let i = 0; i < params.length; i++) {
      const v = params[i]
      await this.set(v.key, v.value, v.expiration || 0, webStorage)
    }
  }

  setSync(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): boolean {
    if (!key) return false
    const k = webStorage.getKey(key)
    webStorage.map[k] = value
    this.set(key, value, expiration, webStorage).then()
    return true
  }

  async delete(key: K, webStorage: WebStorage<K, T>): Promise<void> {
    if (!key) return
    const k = webStorage.getKey(key)
    delete webStorage.map[k]
    await WebStorage.model.Delete({
      label: {
        $value: webStorage.label,
      },
      key: {
        $value: k,
      },
    })
  }

  async mdelete(keys: K[], webStorage: WebStorage<K, T>): Promise<void> {
    for (let i = 0; i < keys.length; i++) {
      const v = keys[i]
      await this.delete(v, webStorage)
    }
  }

  deleteAll(webStorage: WebStorage<K, T>): void {
    webStorage.map = {}
    WebStorage.model
      .Delete({
        label: {
          $value: webStorage.label,
        },
      })
      .then((v: any) => {})
      .catch((err: any) => {
        throw err
      })
  }

  setLabel(label: string, webStorage: WebStorage<K, T>): void {}

  async cleanupExpired(webStorage: WebStorage<K, T>): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        const now = new Date().getTime()
        let cleanedCount = 0

        // 先获取所有数据
        const allData = await WebStorage.model
          .Find({
            label: {
              $value: webStorage.label,
            },
          })
          .Result()

        // 查找过期的数据
        const expiredKeys: string[] = []
        for (const item of allData) {
          try {
            const vObj: Value<T> = JSON.parse(item.data)
            // 检查是否过期（-1 表示永久不过期）
            if (vObj.expiration !== -1 && vObj.expiration < now) {
              expiredKeys.push(item.key)
              // 同时清理内存缓存
              delete webStorage.map[item.key]
            }
          } catch {
            continue
          }
        }

        // 批量删除过期数据
        if (expiredKeys.length > 0) {
          await WebStorage.model.Delete({
            label: {
              $value: webStorage.label,
            },
            key: {
              $in: expiredKeys as any[],
            },
          })
          cleanedCount = expiredKeys.length
        }

        resolve(cleanedCount)
      } catch (error) {
        console.error('Cleanup expired data failed:', error)
        resolve(0)
      }
    })
  }
}

class ElectronNodeFsStorageStrategy<
  K = string,
  T = any,
> implements StorageStrategy<K, T> {
  async get(key: K, webStorage: WebStorage<K, T>): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      try {
        if (!key) {
          resolve(webStorage.undefinedValue())
          return
        }
        const v = await WebStorage.electronNodeFsStorageMethods.request({
          type: 'get',
          key: String(key),
          label: webStorage.label,
        })
        console.log('ElectronNodeFsStorage', key, v)
        resolve(v)
      } catch (error) {
        console.error(error)
        return reject(webStorage.undefinedValue())
      }
    })
  }

  getSync(key: K, webStorage: WebStorage<K, T>): T {
    console.error(
      'ElectronNodeFsStorage does not support synchronous functions'
    )
    return webStorage.undefinedValue()
  }

  async getAndSet(
    key: K,
    func: (value: T) => Promise<T>,
    webStorage: WebStorage<K, T>
  ): Promise<T> {
    const v = await this.get(key, webStorage)
    const nv = await func(v)
    await this.set(key, nv, 0, webStorage)
    return nv
  }

  async mget(
    keys: K[],
    webStorage: WebStorage<K, T>
  ): Promise<{ key: K; value: T }[]> {
    return new Promise<{ key: K; value: T }[]>(async (resolve, reject) => {
      try {
        const res = await WebStorage.electronNodeFsStorageMethods
          .request({
            type: 'getAll',
            label: webStorage.label,
          })
          .then()
        resolve(res || [])
      } catch (error) {
        console.error(error)
        return reject(webStorage.undefinedValue())
      }
    })
  }

  async getAll(webStorage: WebStorage<K, T>): Promise<{ key: K; value: T }[]> {
    return new Promise<{ key: K; value: T }[]>(async (resolve, reject) => {
      try {
        const res = await WebStorage.electronNodeFsStorageMethods
          .request({
            type: 'getAll',
            label: webStorage.label,
          })
          .then()
        resolve(res || [])
      } catch (error) {
        console.error(error)
        return reject(webStorage.undefinedValue())
      }
    })
  }

  getAllSync(webStorage: WebStorage<K, T>): { key: K; value: T }[] {
    return []
  }

  async set(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      if (!key) return resolve(false)
      webStorage.asyncQueue.increase(async () => {
        try {
          WebStorage.electronNodeFsStorageMethods
            .request({
              type: 'set',
              key: String(key),
              label: webStorage.label,
              value: value,
              expiration,
            })
            .then((v) => {
              resolve(v)
            })
            .catch((err) => {
              console.log(err)
              resolve(false)
            })
        } catch (error) {
          console.error(error)
          return reject(webStorage.undefinedValue())
        }
      })
    })
  }

  async mset(
    params: { key: K; value: T; expiration: number }[],
    webStorage: WebStorage<K, T>
  ): Promise<void> {
    for (let i = 0; i < params.length; i++) {
      const v = params[i]
      await this.set(v.key, v.value, v.expiration || 0, webStorage)
    }
  }

  setSync(
    key: K,
    value: T,
    expiration: number,
    webStorage: WebStorage<K, T>
  ): boolean {
    WebStorage.electronNodeFsStorageMethods
      .request({
        type: 'set',
        key: String(key),
        label: webStorage.label,
        value: value,
        expiration,
      })
      .then()
    return true
  }

  async delete(key: K, webStorage: WebStorage<K, T>): Promise<void> {
    if (!key) return
    await WebStorage.electronNodeFsStorageMethods.request({
      type: 'delete',
      key: String(key),
      label: webStorage.label,
    })
  }

  async mdelete(keys: K[], webStorage: WebStorage<K, T>): Promise<void> {
    for (let i = 0; i < keys.length; i++) {
      const v = keys[i]
      await this.delete(v, webStorage)
    }
  }

  deleteAll(webStorage: WebStorage<K, T>): void {
    WebStorage.electronNodeFsStorageMethods
      .request({
        type: 'deleteAll',
        label: webStorage.label,
      })
      .then((v: any) => {})
      .catch((err: any) => {
        throw err
      })
  }

  setLabel(label: string, webStorage: WebStorage<K, T>): void {
    WebStorage.electronNodeFsStorageMethods
      .request({
        type: 'setLabel',
        label: label,
        options: {
          oldLabel: webStorage.label,
        },
      })
      .then()
  }

  async cleanupExpired(webStorage: WebStorage<K, T>): Promise<number> {
    try {
      const result = await WebStorage.electronNodeFsStorageMethods.request({
        type: 'cleanupExpired',
        label: webStorage.label,
      })
      return result || 0
    } catch (error) {
      console.error('ElectronNodeFsStorage cleanupExpired failed:', error)
      return 0
    }
  }
}

// const storageStrategies: Record<string, new () => StorageStrategy> = {
//   LocalStorage: LocalStorageStrategy,
//   IndexedDB: IndexedDBStrategy,
//   ElectronNodeFsStorage: ElectronNodeFsStorageStrategy,
// }

export class WebStorage<K = string, T = any> {
  static globalEncryptionKey = ''
  static nyanyadb = nyanyadb
  static model = model
  private storage: StorageOptions['storage'] = 'IndexedDB'
  public encryption: StorageOptions['encryption'] = {
    enable: false,
  }
  public baseLabel: string = ''
  public label: string = ''
  public map: {
    [key: string]: T
  } = {}
  static storageKeys: WebStorage<string, string[]>
  public keys: K[] = []
  public asyncQueue = new AsyncQueue()
  private changeLabelHandlers: (() => void)[] = []
  private strategy: StorageStrategy<K, T>

  // 定期清理相关
  private cleanupTimer: number | null = null
  private cleanupInterval: number = 60 * 60 * 1000 // 默认 1 小时
  private cleanupEnabled: boolean = false

  constructor(options: StorageOptions) {
    options.storage && (this.storage = options.storage)
    options.baseLabel && (this.baseLabel = options.baseLabel)

    const storageType = this.storage || 'IndexedDB'
    // const StrategyClass = storageStrategies[storageType]
    // this.strategy = new StrategyClass() as StorageStrategy<K, T>

    if (storageType === 'LocalStorage') {
      this.strategy = new LocalStorageStrategy() as unknown as StorageStrategy<
        K,
        T
      >
    } else if (storageType === 'IndexedDB') {
      this.strategy = new IndexedDBStrategy() as unknown as StorageStrategy<
        K,
        T
      >
    } else {
      this.strategy =
        new ElectronNodeFsStorageStrategy() as unknown as StorageStrategy<K, T>
    }

    this.setLabel(options.baseLabel)
    if (options?.encryption?.enable) {
      if (!this.encryption) {
        this.encryption = {
          enable: false,
        }
      }
      this.encryption.enable = true
      if (options.encryption.key) {
        this.encryption.key = options.encryption.key
      } else {
        this.encryption.key = WebStorage.globalEncryptionKey
      }
    }
    if (options?.storage === 'IndexedDB' && !WebStorage.nyanyadb) {
    }

    if (options.storage === 'LocalStorage') {
      this.initKeys()
    }

    // if (this.storage === 'ElectronNodeFsStorage') {
    // 	WebStorage.electronNodeFsStorageMethods
    // 		.request({
    // 			type: 'init',
    // 			label: this.label,
    // 		})
    // 		.then()
    // }

    // 初始化定期清理
    if (options.cleanup?.enable) {
      this.cleanupEnabled = true
      if (options.cleanup.interval) {
        this.cleanupInterval = options.cleanup.interval
      }
      this.startCleanup()
    }
  }

  /**
   * 启动定期清理任务
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      this.stopCleanup()
    }

    // 立即执行一次清理
    this.cleanupExpired().catch((err) => {
      console.error('Initial cleanup failed:', err)
    })

    // 设置定时清理
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupExpired().catch((err) => {
        console.error('Periodic cleanup failed:', err)
      })
    }, this.cleanupInterval)
  }

  /**
   * 停止定期清理任务
   */
  public stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 手动清理过期数据
   * @returns 清理的数据数量
   */
  public async cleanupExpired(): Promise<number> {
    return this.strategy.cleanupExpired(this)
  }

  /**
   * 设置清理间隔
   * @param interval 间隔（毫秒）
   */
  public setCleanupInterval(interval: number): void {
    this.cleanupInterval = interval
    if (this.cleanupEnabled && this.cleanupTimer) {
      this.startCleanup() // 重启定时器以应用新间隔
    }
  }

  /**
   * 启用/禁用定期清理
   * @param enabled 是否启用
   */
  public setCleanupEnabled(enabled: boolean): void {
    if (enabled === this.cleanupEnabled) return

    this.cleanupEnabled = enabled
    if (enabled) {
      this.startCleanup()
    } else {
      this.stopCleanup()
    }
  }

  /**
   * 销毁实例，清理定时器
   */
  public destroy(): void {
    this.stopCleanup()
    this.changeLabelHandlers = []
    this.map = {}
    this.keys = []
  }
  public initKeys() {
    // console.log('initKeys')
    // this.updateKeys()
    this.asyncQueue.increase(async () => {
      let v = await WebStorage.storageKeys.get(this.label)

      !v && (v = [])
      v.forEach((sv) => {
        const k = JSON.parse(sv)
        let isExist = false
        this.keys.some((ssv) => {
          if (ssv === k.key) {
            isExist = true
            return true
          }
        })
        if (!isExist) {
          this.keys.push(k.key)
        }
      })
    })
  }
  public updateKeys() {
    this.asyncQueue.increase(async () => {
      await WebStorage.storageKeys.getAndSet(this.label, async (v) => {
        !v && (v = [])

        this.keys.forEach((sv) => {
          const k = JSON.stringify({
            key: sv,
          })
          let isExist = false
          v.some((ssv) => {
            if (ssv === k) {
              isExist = true
              return true
            }
          })
          if (!isExist) {
            v.push(k)
          }
        })

        return v
      })
      // console.log(this.keys, this)
    })
  }

  static electronNodeFsStorageRequestObj: {
    [requestId: string]: any
  } = {}
  static electronNodeFsStorageMethods = {
    getParams(data: {
      type: string
      label: string
      key?: string
      expiration?: number
      value?: any
    }) {
      const obj = {
        ...data,
        requestId: '',
        requestTime: new Date().getTime(),
      }
      obj.requestId = md5(JSON.stringify(obj) + Math.random())
      // console.log(obj.type, obj.requestId)
      return obj
    },
    requestFunc: (
      requestId: string,
      func: (data: {
        requestId: string
        requestTime: number
        type: string
        label: string
        key: string
        value?: any
      }) => void
    ) => {
      WebStorage.electronNodeFsStorageRequestObj[requestId] = func
    },
    request(data: {
      type:
        | 'setLabel'
        | 'init'
        | 'get'
        | 'getAndSet'
        | 'getAll'
        | 'set'
        | 'delete'
        | 'deleteAll'
        | 'cleanupExpired'
      label: string
      key?: string
      value?: any
      expiration?: number
      options?: any
    }) {
      return new Promise<any>((resolve, reject) => {
        try {
          if (typeof window === 'undefined') {
            return
          }
          if (!window?.require) {
            reject('Non-electron environment')
            return
          }
          const { getParams, requestFunc } =
            WebStorage.electronNodeFsStorageMethods

          const electron = window?.require?.('electron')

          if (!electron) {
            return
          }
          const { ipcRenderer } = electron
          const params = getParams(data)
          console.log(params.requestId, data)
          ipcRenderer?.send?.('NodeFsStoragerAPI', params)
          requestFunc(params.requestId, (data) => {
            resolve(data.value)
          })
        } catch (error) {
          reject(error)
        }
      })
    },
  }
  static electronNodeFsStorageStatus = false
  static electronNodeFsStorageInit() {
    if (typeof window === 'undefined') {
      return
    }
    if (!window?.require) return

    if (WebStorage.electronNodeFsStorageStatus) return
    // console.log(window)
    const electron = window?.require?.('electron')

    if (!electron) {
      return
    }
    const { ipcRenderer } = electron

    ipcRenderer.on(
      'NodeFsStorageROUTER',
      (
        event: any,
        arg: {
          requestId: string
          requestTime: number
          type: string
          label: string
          key: string
          value?: any
        }
      ) => {
        // console.log(arg, requestObj, !!requestObj[arg.requestId])
        WebStorage.electronNodeFsStorageRequestObj?.[arg.requestId]?.(arg)
        delete WebStorage.electronNodeFsStorageRequestObj?.[arg.requestId]
      }
    )
    WebStorage.electronNodeFsStorageStatus = true

    return
  }
  public getLabel() {
    return this.baseLabel
  }
  public getBaseLabel() {
    return this.baseLabel
  }
  changeLabel(func: () => void) {
    this.changeLabelHandlers.push(func)
  }

  public setLabel(label: string) {
    this.strategy.setLabel(label, this)
    this.label = label
    this.changeLabelHandlers.forEach((v) => {
      v()
    })
  }
  public getValue(value: any, expiration: number) {
    const obj: Value<T> = {
      value: value,
      expiration: -1,
    }
    if (expiration) {
      obj.expiration = new Date().getTime() + expiration
    }
    return {
      toString() {
        return JSON.stringify(obj)
      },
      toJson() {
        return obj
      },
    }
  }
  public getKey(key: K) {
    return JSON.stringify({
      label: this.label,
      key: key,
    })
  }
  public getOriginalKey(key: string): K {
    return JSON.parse(key).key
  }
  public undefinedValue(): any {
    return undefined
  }
  public async get(key: K) {
    return this.strategy.get(key, this)
  }
  public getSync(key: K): T {
    return this.strategy.getSync(key, this)
  }
  public async getAndSet(key: K, func: (value: T) => Promise<T>) {
    return this.strategy.getAndSet(key, func, this)
  }
  public async mget(keys: K[]) {
    return this.strategy.mget(keys, this)
  }
  public async getAll() {
    return this.strategy.getAll(this)
  }
  public getAllSync(): {
    key: K
    value: T
  }[] {
    return this.strategy.getAllSync(this)
  }
  // expiration(s)
  public set(key: K, value: T, expiration: number = 0) {
    return this.strategy.set(key, value, expiration, this)
  }
  public async mset(
    params: {
      key: K
      value: T
      expiration: number
    }[]
  ) {
    return this.strategy.mset(params, this)
  }
  public setSync(key: K, value: T, expiration: number = 0): boolean {
    return this.strategy.setSync(key, value, expiration, this)
  }
  public async delete(key: K) {
    return this.strategy.delete(key, this)
  }
  public async mdelete(keys: K[]) {
    return this.strategy.mdelete(keys, this)
  }
  public deleteAll() {
    return this.strategy.deleteAll(this)
  }
}
if (!WebStorage.storageKeys) {
  WebStorage.storageKeys = new WebStorage<string, string[]>({
    storage: 'IndexedDB',
    baseLabel: 'storageKeys',
  })
}
WebStorage.electronNodeFsStorageInit()
// console.log('WebStorage.storageKeys', WebStorage.storageKeys)

// WebStorage.storageKeys.getAll().then((v) => {
// 	console.log('v', v)
// })
export default WebStorage
