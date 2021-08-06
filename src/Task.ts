import { ITask } from "./common";

export default class BaseTask {
  initOnRun = false;
  name: string = "";
  crontabs: string[] = [];
  status = 0; // 0 未启动  1 运行中 2 正常结束 3 异常结束 4 手动停止
  // 手动停止任务
  async stop() {}
  // 手动运行任务
  async run(): Promise<(() => void) | void> {}
  isRunning() {
    return this.status === 1;
  }
  isStop() {
    return this.isError() || this.isSunccess();
  }
  isError() {
    return this.status === 3;
  }
  isSunccess() {
    return this.status == 2;
  }
}

export function createTask(tasks: ITask | ITask[]) {
  return tasks;
}
