import log4js from "log4js";
export default class ServiceOfLogger {
  private initLogger() {
    log4js.configure({
      appenders: {
        console: {
          type: "console",
        },
        file: {
          type: "dateFile",
          filename: "logs/info",
          pattern: "-yyyy-MM-dd-hh.log",
          alwaysIncludePattern: true,
          // 指定编码格式为 utf-8
          encoding: "utf-8",
          keepFileExt: true,
        },
        error: {
          type: "dateFile",
          filename: "logs/error",
          pattern: "-yyyy-MM-dd-hh.log",
          alwaysIncludePattern: true,
          // 指定编码格式为 utf-8
          encoding: "utf-8",
          keepFileExt: true,
        },
      },
      categories: {
        default: {
          appenders: ["console", "file"],
          level: "info",
        },
        error: {
          appenders: ["console", "error"],
          level: "error",
        },
      },
      pm2: true,
    });
  }

  constructor() {
    this.initLogger();
  }
  private getLogger(category: string = "default") {
    return log4js.getLogger(category);
  }
  info(message: any, ...args: any) {
    return this.getLogger().info(message, ...args);
  }
  debug(message: any, ...args: any) {
    return this.getLogger().debug(message, ...args);
  }
  error(message: any, ...args: any) {
    return this.getLogger("error").error(message, ...args);
  }
}
