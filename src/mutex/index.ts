export class Mutex {
  private locked = false
  private queue: (() => void)[] = []

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true
      return
    }

    return new Promise((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      next?.()
    } else {
      this.locked = false
    }
  }

  isLocked(): boolean {
    return this.locked
  }

  clear(): void {
    this.queue = []
    this.locked = false
  }
}

export class MutexManager {
  private mutexes = new Map<string, Mutex>()

  /**
   * 获取指定 key 的锁
   * @param key 锁的唯一标识
   * @returns Mutex 实例
   */
  getMutex(key: string): Mutex {
    if (!this.mutexes.has(key)) {
      this.mutexes.set(key, new Mutex())
    }
    return this.mutexes.get(key)!
  }

  /**
   * 获取锁（自动管理）
   * @param key 锁的唯一标识
   * @returns 释放锁的函数
   */
  async acquire(key: string): Promise<() => void> {
    const mutex = this.getMutex(key)
    await mutex.acquire()
    return () => mutex.release()
  }

  /**
   * 检查指定 key 的锁是否被占用
   */
  isLocked(key: string): boolean {
    return this.mutexes.get(key)?.isLocked() ?? false
  }

  /**
   * 清空指定 key 的锁
   */
  clear(key?: string): void {
    if (key) {
      this.mutexes.delete(key)
    } else {
      this.mutexes.clear()
    }
  }

  /**
   * 获取所有被占用的锁 key
   */
  getActiveLocks(): string[] {
    const active: string[] = []
    for (const [key, mutex] of this.mutexes) {
      if (mutex.isLocked()) {
        active.push(key)
      }
    }
    return active
  }
}

// 导出单例，方便全局使用
export const mutexManager = new MutexManager()
