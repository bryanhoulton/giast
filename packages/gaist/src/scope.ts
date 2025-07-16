import { Literal } from './grammar';
import { Logger } from './logger';

type ScopeConfig = {
  vars: Record<string, Literal>;
  parent?: Scope;
  logger: Logger;
  onChange?: () => void;
};

export class ScopeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScopeException";
  }
}

export class Scope {
  private vars: Record<string, Literal>;
  private parent?: Scope;
  private uuid: string;
  private logger: Logger;
  private onChange?: () => void;

  constructor(config: ScopeConfig) {
    this.vars = config.vars;
    this.parent = config.parent;
    this.uuid =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    this.logger = config.logger;
    this.onChange = config.onChange;
  }

  get(name: string): Literal {
    if (name in this.vars) {
      return this.vars[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new ScopeException(`Variable ${name} not found in scope`);
  }

  _possiblySet(name: string, value: Literal): boolean {
    if (name in this.vars) {
      this.logger.log(
        "scope",
        "Setting value in scope",
        this.uuid,
        name,
        value
      );
      this.vars[name] = value;
      this.onChange?.();
      return true;
    }
    if (this.parent?._possiblySet(name, value)) {
      return true;
    }
    this.logger.log(
      "scope",
      "Variable not found in scope",
      this.uuid,
      name,
      value
    );
    return false;
  }

  set(name: string, value: Literal): boolean {
    if (this._possiblySet(name, value)) {
      return true;
    }
    // Variable not found anywhere, set it in current scope
    this.logger.log("scope", "Setting value in scope", this.uuid, name, value);
    this.vars[name] = value;
    this.onChange?.();
    return false;
  }

  extend(): Scope {
    return new Scope({
      vars: {},
      parent: this,
      logger: this.logger,
      onChange: this.onChange,
    });
  }
}
