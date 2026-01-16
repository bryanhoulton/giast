export { compile } from "./compiler.js";
export { ParseError, Parser } from "./parser.js";
export { Tokenizer, TokenizerError, TokenType } from "./tokenizer.js";
export {
  ExpressionError,
  FunctionError,
  Runtime,
  RuntimeConfig,
  RuntimeError,
  RuntimeException,
  TypeError,
  VariableError,
} from "./runtime.js";
export { Scope, ScopeConfig, ScopeException } from "./scope.js";
export { Logger, LoggerConfig } from "./logger.js";
export * from "./grammar.js";

// Test utilities are NOT exported from main entry point
// They use Node.js fs module and can't run in browsers
// Import directly from 'gaist/test' for Node.js test environments
