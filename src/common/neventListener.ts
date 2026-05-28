import { getShortId } from '../shortId'

type F<V = any> = (value: V) => void

// 定义内部存储的监听者结构
interface ListenerItem {
  key?: string
  func: F<any>
}

export class NEventListener<T extends Record<string | symbol, any>> {
  // 核心改动：Map 内部存的是 ListenerItem 对象的数组
  private handlers = new Map<keyof T, ListenerItem[]>()

  constructor() {}

  /**
   * 订阅事件
   * @param event 事件名
   * @param func 回调函数
   * @param key 可选的自定义唯一标识符（用于后续通过 key 解绑）
   */
  public on<E extends keyof T>(
    event: E,
    func: F<T[E]>,
    options?: {
      key?: string
    }
  ) {
    if (!func) return () => {}

    const item: ListenerItem = {
      func,
      key: options?.key || getShortId(12),
    }

    if (!this.handlers.has(event)) {
      this.handlers.set(event, [item])
    } else {
      this.handlers.get(event)!.push(item)
    }

    // 依然返回闭包解绑，多一重保障
    return {
      off: () => {
        this.off(event, func)
      },
    }
  }

  /**
   * 解绑函数：同时支持传入【函数】或【自定义字符串 Key】
   * @param event 事件名
   * @param target 可以是原本的 func，也可以是自定义的 key
   */
  public off<E extends keyof T>(event: E, target: F<T[E]> | string) {
    const list = this.handlers.get(event)
    if (!list) return

    let index = -1
    if (typeof target === 'string') {
      // 如果传入的是字符串，按自定义 key 查找
      index = list.findIndex((item) => item.key === target)
    } else {
      // 如果传入的是函数，按原生函数引用查找
      index = list.findIndex((item) => item.func === target)
    }

    if (index !== -1) {
      list.splice(index, 1)
    }

    if (list.length === 0) {
      this.handlers.delete(event)
    }
  }

  /**
   * 触发事件
   */
  public dispatch<E extends keyof T>(event: E, value: T[E]) {
    const list = this.handlers.get(event)
    if (!list) return

    // 浅拷贝安全遍历
    const targets = [...list]
    targets.forEach((item) => {
      try {
        item.func(value)
      } catch (e) {
        console.error(`Error in event listener [${String(event)}]:`, e)
      }
    })
  }

  /**
   * 清除指定事件的所有监听
   */
  public removeEvent<E extends keyof T>(event: E) {
    this.handlers.delete(event)
  }

  /**
   * 清除全部事件
   */
  public removeAllEvent() {
    this.handlers.clear()
  }

  /**
   * 获取所有注册的事件名
   */
  public getEventNames(): string[] {
    return Array.from(this.handlers.keys()).map(String)
  }
}
