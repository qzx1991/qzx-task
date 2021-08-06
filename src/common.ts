export function isProduction() {
  return process.env.NODE_ENV === "production";
}

const DEFAULT_ASSERT_HANDLER: (msg: string) => void = (msg: string) => {
  throw new Error(msg);
};
export function assert(
  condition: boolean,
  message: string,
  handler = DEFAULT_ASSERT_HANDLER
) {
  if (!condition) {
    handler(message);
    return false;
  }
  return true;
}
export function assertMulti(
  conditions: [boolean, string][],

  handler = DEFAULT_ASSERT_HANDLER
) {
  const notpassed = conditions.filter(([condition]) => !condition);
  if (!notpassed || notpassed.length <= 0) return true;
  const messages = notpassed.map(([, msg]) => msg);
  handler(messages.join("\n"));
  return false;
}

export type IQzxTaskHandler = () => Promise<VoidFunction | any> | void;
export interface ITask {
  name: string;
  crons: string[] | string;
  handler: IQzxTaskHandler;
  initOnRun?: boolean;
}
