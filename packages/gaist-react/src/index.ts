// ============================================================================
// Catalog API - Define your own components
// ============================================================================

export { Catalog, createCatalog } from './catalog.js';
export type {
  ActionCall,
  CatalogSchema,
  ComponentRegistry,
  ComponentRenderFn,
  ComponentSchema,
  ElementNode,
  Expression,
  FuncDef,
  GaistProgram,
  RenderContext,
  Statement,
  StateVar,
  UIElement,
} from './catalog.js';

// ============================================================================
// Renderer - Render user-defined components
// ============================================================================

export { GaistRenderer } from './catalog-renderer.js';
export type { GaistRendererProps } from './catalog-renderer.js';

// ============================================================================
// UI DSL Parser
// ============================================================================

export {
  ParseError as UIDSLParseError,
  parseUI,
  parseUIElements,
} from './ui-dsl.js';

// ============================================================================
// Utilities
// ============================================================================

export { GaistErrorBoundary } from './component.js';
export type { GaistErrorBoundaryProps } from './component.js';

// ============================================================================
// Re-exports from gaist core
// ============================================================================

export type {
  Expr,
  Func,
  FuncParam,
  Literal,
  LoggerConfig,
  Logic,
  Program,
  RuntimeConfig,
  Scope,
  State,
  Stmt,
} from './types.js';

export {
  ExpressionError,
  FunctionError,
  Runtime,
  RuntimeError,
  ScopeException,
  TypeError,
  VariableError,
} from './types.js';
