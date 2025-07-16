class ScopeException extends Error {
    constructor(message) {
        super(message);
        this.name = "ScopeException";
    }
}
export class Scope {
    constructor(config) {
        Object.defineProperty(this, "vars", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "parent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "uuid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onChange", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.vars = config.vars;
        this.parent = config.parent;
        this.uuid = crypto.randomUUID();
        this.logger = config.logger;
        this.onChange = config.onChange;
    }
    get(name) {
        if (name in this.vars) {
            return this.vars[name];
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new ScopeException(`Variable ${name} not found in scope`);
    }
    _possiblySet(name, value) {
        if (name in this.vars) {
            this.logger.log("scope", "Setting value in scope", this.uuid, name, value);
            this.vars[name] = value;
            this.onChange?.();
            return true;
        }
        if (this.parent?._possiblySet(name, value)) {
            return true;
        }
        this.logger.log("scope", "Variable not found in scope", this.uuid, name, value);
        return false;
    }
    set(name, value) {
        if (this._possiblySet(name, value)) {
            return true;
        }
        // Variable not found anywhere, set it in current scope
        this.logger.log("scope", "Setting value in scope", this.uuid, name, value);
        this.vars[name] = value;
        this.onChange?.();
        return false;
    }
    extend() {
        return new Scope({
            vars: {},
            parent: this,
            logger: this.logger,
            onChange: this.onChange,
        });
    }
}
