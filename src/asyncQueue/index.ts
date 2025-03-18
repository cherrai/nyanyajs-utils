import { Wait } from "../common/wait"
import { Debounce } from "../debounce"

// import { Debounce } from "@nyanyajs/utils";
// import { Wait } from "./wait"

export interface AsyncQueueOptions {
  maxQueueConcurrency?: number
  runInterval?: number
  debounceWait?: number
}
// 曾经叫RunQueue
export class AsyncQueue {

  private maxQueueConcurrency = 0
  private runInterval = 0
  private runningCount = 0


  public wait: Wait
  private d: Debounce


  private queue: {
    func: () => Promise<any>
  }[] = []
  constructor(options?: AsyncQueueOptions) {
    this.maxQueueConcurrency = options?.maxQueueConcurrency || 3
    this.runInterval = options?.runInterval || 0

    this.wait = new Wait()
    this.d = new Debounce()

    // console.log("getAllTripPositions new aq", this)

  }

  private async runNext() {
    if (this.runningCount >= this.maxQueueConcurrency || this.queue.length === 0) {

      // console.log("getAllTripPositions this.queue.length === 0 && this.runningCount === 0",
      //   this.queue.length, this.runningCount,
      //   this.queue.length === 0 && this.runningCount === 0)
      if (this.queue.length === 0 && this.runningCount === 0) {
        this.d.increase(() => {
          this.wait.dispatch()
          // console.log("getAllTripPositions allRes",)
        }, 100)
      }

      return
    }

    const nextTask = this.queue.shift();

    if (!nextTask) return;

    this.runningCount++;
    try {
      await nextTask.func();
    } finally {
      this.runningCount--;
      this.run()
    }
  }

  private run() {
    if (this.runInterval) {
      setTimeout(() => {
        this.runNext();
      }, this.runInterval);
    } else {
      this.runNext();
    }

  }

  public increase(func: () => Promise<any>) {
    this.queue.push({
      func,
    });

    this.run()
  }
  public decrease() {
    this.queue = []

    if (this.queue.length === 0) {
      this.wait.dispatch()
      this.wait.revoke()
    }
  }
  public decreaseAll() {
    this.queue = []

    if (this.queue.length === 0) {
      this.wait.dispatch()
      this.wait.revoke()
    }
  }
}
