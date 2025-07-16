export class Logger {
    constructor(config) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                expr: [],
                stmt: [],
                scope: [],
            }
        });
        this.config = config;
    }
    log(type, ...args) {
        if (this.config.printTypes.includes(type)) {
            console.log(args);
        }
        if (this.config.storeTypes.includes(type)) {
            this.logs[type].push(args);
        }
    }
    getLogs(type) {
        return this.logs[type];
    }
}
