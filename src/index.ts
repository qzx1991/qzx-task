import BaseTask from "./Task";
import { CronJob } from "cron";
import "colors";
import { assertMulti, IQzxTaskHandler, ITask } from "./common";
import { createTask } from "./Task";
import ServiceOfLogger from "./logger";

type NewType = ITask;

type ITaskType = typeof BaseTask | NewType;
/**
 * 任务控制器
 * 用来控制任务的启动停止等
 */
export { createTask, ITask, IQzxTaskHandler };
export default class TaskController {
  private status = 0; // 0 未执行run 1已执行run 2 已停止
  private tasks: BaseTask[] = [];
  private cronJobs = new Map<BaseTask, CronJob[]>();
  private taskResult = new Map<
    BaseTask,
    (void | (() => void | Promise<any>))[]
  >();

  private logger = new ServiceOfLogger();

  getTask(taskConstructor?: ITaskType): undefined | BaseTask {
    if (!taskConstructor) return undefined;
    if (typeof taskConstructor === "function") {
      return new taskConstructor();
    } else if (typeof taskConstructor === "object") {
      if (
        assertMulti(
          [
            [
              taskConstructor.hasOwnProperty("name"),
              `注册的任务必须给定一个名字`.red,
            ],
            [
              typeof taskConstructor.handler === "function",
              `注册的任务必须给定一个处理方法`.red,
            ],
          ],
          (message: string) =>
            this.logger.error(
              `任务存在错误,${taskConstructor}:\n ${message}`.red
            )
        )
      ) {
        const task = new BaseTask();
        task.name = taskConstructor.name;
        task.run = async () => taskConstructor.handler();
        if (taskConstructor.crons) {
          task.crontabs = !Array.isArray(taskConstructor.crons)
            ? [taskConstructor.crons]
            : taskConstructor.crons;
        }
        task.initOnRun =
          taskConstructor.initOnRun === undefined
            ? task.initOnRun
            : !!taskConstructor.initOnRun;
        return task;
      }
    }
    this.logger.error("注册的任务有误: ", taskConstructor);
    return undefined;
  }

  regist(taskConstructor: ITaskType | ITaskType[]) {
    if (Array.isArray(taskConstructor)) {
      taskConstructor.forEach((i) => this.regist(i));
    } else {
      const task = this.getTask(taskConstructor);
      if (!task) {
        return;
      }
      this.logger.info(`注册了任务:　${task.name}`.green);
      this.tasks.push(task);
      if (this.status === 1) {
        this.runTask(task);
      }
    }
  }
  // 执行所有的任务
  run() {
    this.logger.info("任务控制器开始执行：".cyan);
    this.tasks.forEach((task) => this.runTask(task));
  }
  runTask(task: BaseTask) {
    // 已存在的话先停止/再删除
    if (this.cronJobs.has(task)) {
      this.stopTask(task);
    }
    if (task.initOnRun) this.cronHandler(task);
    task.crontabs.forEach((crontab) => {
      const cron = new CronJob(crontab, async () => this.cronHandler(task));
      if (!this.cronJobs.get(task)) {
        this.cronJobs.set(task, []);
      }
      this.cronJobs.get(task)?.push(cron);
      cron.start();
    });
  }
  // 停止所有的任务
  async stop() {
    this.logger.info("开始停止任务控制器的所有任务");
    await Promise.all(this.tasks.map((t) => this.stopTask(t)));

    this.logger.info("任务控制器的所有任务都已停止");
  }
  private async cronHandler(task: BaseTask) {
    try {
      const begin = new Date();
      this.logger.info(`任务开始执行: ${task.name}`.gray);
      this.stopTaskResult(task);
      const result = await task.run();
      // 存储运行结果，以在手动停止的时候去触发
      if (!this.taskResult.get(task)) {
        this.taskResult.set(task, []);
      }
      this.taskResult.get(task)?.push(result);
      const end = new Date();
      this.logger.info(
        `任务结束执行: ${task.name}, 执行时间: ${+(
          end.getTime() - begin.getTime()
        ).toFixed(4)}ms`.gray
      );
    } catch (e) {
      // 任务发生了错误需要去手动的停止
      this.logger.error(`任务(${task.name})发生了错误: ${e}`);
      this.stopTask(task);
    }
  }
  async stopTask(task: BaseTask) {
    this.logger.info(`开始停止任务: ${task.name}`);
    await this.stopTaskResult(task);
    // 停止任务
    await task.stop();
    // 停止cron定时器
    await this.stopCronJob(task);
    this.logger.info(`任务已停止: ${task.name}`);
  }
  async stopTaskResult(task: BaseTask) {
    const result = this.taskResult.get(task);
    if (result) {
      await Promise.all(result.map((i) => i && typeof i === "function" && i()));
    }
    this.taskResult.delete(task);
  }
  async stopCronJob(task: BaseTask) {
    this.cronJobs.get(task)?.forEach((cron) => cron.stop());
    this.cronJobs.delete(task);
  }
}
