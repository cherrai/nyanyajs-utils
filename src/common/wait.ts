export class Wait {
  private handlers: {
    [k: string]: {
      fl: (() => void)[]
      status: number
      timeoutIds?: NodeJS.Timeout[] // 超时定时器
    }
  } = {}
  async waiting(key: string = 'wait', timeout?: number) {
    // this.revoke(key)
    return new Promise((res, rej) => {
      !this.handlers[key] &&
        (this.handlers[key] = {
          status: 0,
          fl: [],
        })
      if (this.handlers[key].status === 1) {
        res(undefined)
        return
      }
      this.handlers[key].fl.push(() => {
        res(undefined)
      })

      // 设置超时
      if (timeout) {
        const timeoutId = setTimeout(() => {
          // 从队列中移除自己
          const index = this.handlers[key].fl.indexOf(res as any)
          if (index !== -1) this.handlers[key].fl.splice(index, 1)
          rej(new Error(`Wait timeout for "${key}" after ${timeout}ms`))
        }, timeout)

        this.handlers[key].timeoutIds?.push(timeoutId)
      }
    })
  }
  dispatch(key: string = 'wait') {
    !this.handlers[key] &&
      (this.handlers[key] = {
        status: 0,
        fl: [],
      })
    this.handlers[key].status = 1
    this.handlers[key].fl.forEach((res) => {
      res()
    })
    this.handlers[key].fl = []
  }
  revoke(key: string = 'wait') {
    if (this.handlers[key]) {
      this.handlers[key].status = 0
    }
  }
}
