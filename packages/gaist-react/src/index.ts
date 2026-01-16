// Components
export {
  ControlledRuntimeComponent,
  GaistErrorBoundary,
  RuntimeComponent,
  useGaistRuntime,
} from "./component.js";
export type {
  ControlledRuntimeComponentProps,
  RuntimeComponentProps,
  UseGaistRuntimeOptions,
} from "./component.js";

// Component Registry (legacy)
export { defaultComponents } from "./registry.js";
export type {
  BadgeComponentProps,
  ButtonComponentProps,
  CardComponentProps,
  ColumnComponentProps,
  ComponentRegistry,
  ContainerComponentProps,
  DividerComponentProps,
  InputComponentProps,
  RowComponentProps,
  TextComponentProps,
} from "./registry.js";

// Catalog API (recommended)
export { Catalog, createCatalog } from "./catalog.js";
export type {
  ActionCall,
  CatalogSchema,
  ComponentRegistry as CatalogComponentRegistry,
  ComponentRenderFn,
  ComponentSchema,
  ElementNode,
  Expression as CatalogExpression,
  FuncDef,
  GaistProgram,
  RenderContext,
  Statement as CatalogStatement,
  StateVar as CatalogStateVar,
  UIElement,
} from "./catalog.js";

export { GaistRenderer } from "./catalog-renderer.js";
export type { GaistRendererProps } from "./catalog-renderer.js";

// Render utilities
export { render, renderText } from "./render.js";
export type { RenderArgs } from "./render.js";

// Re-export types from gaist
export type {
  BadgeNode,
  ButtonNode,
  CardNode,
  ColumnNode,
  ContainerNode,
  DividerNode,
  Expr,
  Func,
  FuncParam,
  InputNode,
  Literal,
  LoggerConfig,
  Logic,
  Program,
  RowNode,
  RuntimeConfig,
  Scope,
  State,
  StateVar,
  Stmt,
  TextNode,
  UINode,
} from "./types.js";

export {
  ExpressionError,
  FunctionError,
  Runtime,
  RuntimeError,
  ScopeException,
  TypeError,
  VariableError,
} from "./types.js";
