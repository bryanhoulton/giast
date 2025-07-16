export type LogType = "expr" | "stmt" | "scope";

export type LoggerConfig = {
  printTypes: LogType[];
  storeTypes: LogType[];
};

export class Logger {
  private logs: Record<LogType, any[]> = {
    expr: [],
    stmt: [],
    scope: [],
  };

  constructor(private config: LoggerConfig) {
    this.config = config;
  }

  log(type: LogType, ...args: any[]) {
    if (this.config.printTypes.includes(type)) {
      console.log(args);
    }
    if (this.config.storeTypes.includes(type)) {
      this.logs[type].push(args);
    }
  }

  getLogs(type: LogType): string[] {
    return this.logs[type];
  }
}
