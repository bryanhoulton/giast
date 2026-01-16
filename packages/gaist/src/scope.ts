import { Literal } from './grammar.js';
import { Logger } from './logger.js';

export type ScopeConfig = {
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

/**
 * Scope manages variable storage with lexical scoping support.
 * 
 * Features:
 * - Hierarchical scopes (parent chain lookup)
 * - State version tracking for efficient change detection
 * - Batch updates to minimize change notifications
 * - Snapshot/restore for hydration support
 */
export class Scope {
  private vars: Record<string, Literal>;
  private parent?: Scope;
  private uuid: string;
  private logger: Logger;
  private onChange?: () => void;
  
  /** Incremented on every state change - used for efficient React integration */
  private _version = 0;
  
  /** When > 0, changes are batched and onChange is deferred */
  private _batchDepth = 0;
  
  /** Tracks if any changes occurred during a batch */
  private _pendingNotification = false;

  constructor(config: ScopeConfig) {
    this.vars = { ...config.vars }; // Defensive copy
    this.parent = config.parent;
    this.uuid =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    this.logger = config.logger;
    this.onChange = config.onChange;
  }

  /** Current state version - increments on every change */
  get version(): number {
    return this._version;
  }

  /** Unique identifier for this scope instance */
  get id(): string {
    return this.uuid;
  }

  /**
   * Check if a variable exists in this scope or any parent scope
   */
  has(name: string): boolean {
    if (name in this.vars) {
      return true;
    }
    return this.parent?.has(name) ?? false;
  }

  /**
   * Get a variable's value, walking up the scope chain if needed
   * @throws ScopeException if variable not found
   */
  get(name: string): Literal {
    if (name in this.vars) {
      return this.vars[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new ScopeException(`Variable "${name}" not found in scope`);
  }

  /**
   * Get a variable's value or return undefined if not found
   */
  tryGet(name: string): Literal | undefined {
    try {
      return this.get(name);
    } catch {
      return undefined;
    }
  }

  /**
   * Internal: attempt to set a variable if it exists in this scope or parents
   */
  _possiblySet(name: string, value: Literal): boolean {
    if (name in this.vars) {
      const oldValue = this.vars[name];
      if (oldValue === value) {
        return true; // No change needed
      }
      
      this.logger.log(
        "scope",
        "Setting value in scope",
        this.uuid,
        name,
        value
      );
      this.vars[name] = value;
      this._notifyChange();
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

  /**
   * Set a variable's value
   * - First tries to update existing variable in scope chain
   * - If not found, creates new variable in current scope
   * @returns true if variable existed, false if newly created
   */
  set(name: string, value: Literal): boolean {
    if (this._possiblySet(name, value)) {
      return true;
    }
    // Variable not found anywhere, set it in current scope
    this.logger.log("scope", "Setting value in scope", this.uuid, name, value);
    this.vars[name] = value;
    this._notifyChange();
    return false;
  }

  /**
   * Create a child scope with this scope as parent
   */
  extend(): Scope {
    return new Scope({
      vars: {},
      parent: this,
      logger: this.logger,
      onChange: this.onChange,
    });
  }

  /**
   * Get all variables in this scope (not including parents)
   */
  getOwnVars(): Record<string, Literal> {
    return { ...this.vars };
  }

  /**
   * Get all variables including parent scopes
   */
  getAllVars(): Record<string, Literal> {
    const parentVars = this.parent?.getAllVars() ?? {};
    return { ...parentVars, ...this.vars };
  }

  /**
   * Get a snapshot of current state for serialization/hydration
   */
  getSnapshot(): Record<string, Literal> {
    return { ...this.vars };
  }

  /**
   * Restore state from a snapshot (for hydration)
   * Only updates variables that exist in current scope
   */
  restoreSnapshot(snapshot: Record<string, Literal>): void {
    this.batch(() => {
      for (const [name, value] of Object.entries(snapshot)) {
        if (name in this.vars) {
          // Use set() to properly track changes and notify
          this.set(name, value);
        }
      }
    });
  }

  /**
   * Batch multiple updates into a single change notification
   * Useful for initializing multiple state values at once
   */
  batch<T>(fn: () => T): T {
    this._batchDepth++;
    try {
      return fn();
    } finally {
      this._batchDepth--;
      if (this._batchDepth === 0 && this._pendingNotification) {
        this._pendingNotification = false;
        this._version++;
        this.onChange?.();
      }
    }
  }

  /**
   * Internal: handle change notification with batching support
   */
  private _notifyChange(): void {
    if (this._batchDepth > 0) {
      this._pendingNotification = true;
      return;
    }
    this._version++;
    this.onChange?.();
  }
}
