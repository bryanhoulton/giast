// Components
export {
  RuntimeComponent,
  ControlledRuntimeComponent,
  GaistErrorBoundary,
  useGaistRuntime,
} from "./component.js";
export type {
  RuntimeComponentProps,
  ControlledRuntimeComponentProps,
  UseGaistRuntimeOptions,
} from "./component.js";

// Component Registry (legacy)
export { defaultComponents } from "./registry.js";
export type {
  ComponentRegistry,
  TextComponentProps,
  ButtonComponentProps,
  InputComponentProps,
  CardComponentProps,
  ColumnComponentProps,
  RowComponentProps,
  BadgeComponentProps,
  DividerComponentProps,
  ContainerComponentProps,
} from "./registry.js";

// Catalog API (recommended)
export { createCatalog, Catalog } from "./catalog.js";
export type {
  ComponentSchema,
  CatalogSchema,
  ElementNode,
  ActionCall,
  RenderContext,
  ComponentRenderFn,
  ComponentRegistry as CatalogComponentRegistry,
  StateVar as CatalogStateVar,
  FuncDef,
  Statement as CatalogStatement,
  Expression as CatalogExpression,
  UIElement,
  GaistProgram,
} from "./catalog.js";

export { GaistRenderer } from "./catalog-renderer.js";
export type { GaistRendererProps } from "./catalog-renderer.js";

// Render utilities
export { render, renderText } from "./render.js";
export type { RenderArgs } from "./render.js";

// Re-export types from gaist
export type {
  Expr,
  Func,
  FuncParam,
  Literal,
  Logic,
  State,
  StateVar,
  Stmt,
  Scope,
  LoggerConfig,
  // UI Node types
  UINode,
  TextNode,
  ButtonNode,
  InputNode,
  ColumnNode,
  RowNode,
  CardNode,
  BadgeNode,
  DividerNode,
  ContainerNode,
  // Program types
  Program,
  RuntimeConfig,
} from "./types.js";

export {
  Runtime,
  RuntimeError,
  TypeError,
  VariableError,
  FunctionError,
  ExpressionError,
  ScopeException,
} from "./types.js";
