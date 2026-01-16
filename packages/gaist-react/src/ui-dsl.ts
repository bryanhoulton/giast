import { z } from 'zod';

import type {
  ActionCall,
  Catalog,
  Expression,
  UIElement,
} from './catalog.js';

// ============================================================================
// Tokens
// ============================================================================

type TokenType =
  | "IDENT"
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "LPAREN"
  | "RPAREN"
  | "LBRACE"
  | "RBRACE"
  | "COLON"
  | "COMMA"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ============================================================================
// Tokenizer
// ============================================================================

class Tokenizer {
  private input: string;
  private pos = 0;
  private line = 1;
  private column = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const char = this.input[this.pos];

      // Single-character tokens
      if (char === "(") {
        tokens.push(this.makeToken("LPAREN", "("));
        this.advance();
      } else if (char === ")") {
        tokens.push(this.makeToken("RPAREN", ")"));
        this.advance();
      } else if (char === "{") {
        tokens.push(this.makeToken("LBRACE", "{"));
        this.advance();
      } else if (char === "}") {
        tokens.push(this.makeToken("RBRACE", "}"));
        this.advance();
      } else if (char === ":") {
        tokens.push(this.makeToken("COLON", ":"));
        this.advance();
      } else if (char === ",") {
        tokens.push(this.makeToken("COMMA", ","));
        this.advance();
      } else if (char === '"' || char === "'") {
        tokens.push(this.readString(char));
      } else if (this.isDigit(char) || (char === "-" && this.isDigit(this.peek(1)))) {
        tokens.push(this.readNumber());
      } else if (this.isAlpha(char)) {
        tokens.push(this.readIdentifier());
      } else if (char === "/" && this.peek(1) === "/") {
        // Single-line comment
        this.skipLineComment();
      } else if (char === "/" && this.peek(1) === "*") {
        // Multi-line comment
        this.skipBlockComment();
      } else {
        throw new ParseError(`Unexpected character: '${char}'`, this.line, this.column);
      }
    }

    tokens.push(this.makeToken("EOF", ""));
    return tokens;
  }

  private makeToken(type: TokenType, value: string): Token {
    return { type, value, line: this.line, column: this.column };
  }

  private advance(): void {
    if (this.input[this.pos] === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
  }

  private peek(offset = 0): string {
    return this.input[this.pos + offset] ?? "";
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.advance();
    }
  }

  private skipLineComment(): void {
    while (this.pos < this.input.length && this.input[this.pos] !== "\n") {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance(); // skip /
    this.advance(); // skip *
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === "*" && this.peek(1) === "/") {
        this.advance();
        this.advance();
        return;
      }
      this.advance();
    }
    throw new ParseError("Unterminated block comment", this.line, this.column);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private readString(quote: string): Token {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // skip opening quote

    let value = "";
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === "\\") {
        this.advance();
        const escaped = this.input[this.pos];
        switch (escaped) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += escaped;
        }
      } else {
        value += this.input[this.pos];
      }
      this.advance();
    }

    if (this.pos >= this.input.length) {
      throw new ParseError("Unterminated string", startLine, startColumn);
    }

    this.advance(); // skip closing quote
    return { type: "STRING", value, line: startLine, column: startColumn };
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    if (this.input[this.pos] === "-") {
      value += "-";
      this.advance();
    }

    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      value += this.input[this.pos];
      this.advance();
    }

    if (this.input[this.pos] === ".") {
      value += ".";
      this.advance();
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        value += this.input[this.pos];
        this.advance();
      }
    }

    return { type: "NUMBER", value, line: startLine, column: startColumn };
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    while (this.pos < this.input.length && this.isAlphaNumeric(this.input[this.pos])) {
      value += this.input[this.pos];
      this.advance();
    }

    // Check for boolean keywords
    if (value === "true" || value === "false") {
      return { type: "BOOLEAN", value, line: startLine, column: startColumn };
    }

    return { type: "IDENT", value, line: startLine, column: startColumn };
  }
}

// ============================================================================
// Parser Error
// ============================================================================

export class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = "ParseError";
  }
}

// ============================================================================
// Parser
// ============================================================================

class Parser {
  private tokens: Token[];
  private pos = 0;
  private catalog: Catalog;

  constructor(tokens: Token[], catalog: Catalog) {
    this.tokens = tokens;
    this.catalog = catalog;
  }

  /**
   * Parse: element*
   * Returns array of elements (usually one root, but allows multiple)
   */
  parse(): UIElement[] {
    const elements: UIElement[] = [];
    while (!this.isAtEnd()) {
      elements.push(this.parseElement());
    }
    return elements;
  }

  /**
   * element := IDENT props? (action | children)?
   * 
   * Examples:
   *   Divider
   *   Text(content: "Hello")
   *   Button(label: "Click") { onClick: handleClick }
   *   Card { Text(content: "Hi") }
   *   Text(content: "Hidden", visible: isShowing)
   */
  private parseElement(): UIElement {
    const typeToken = this.consume("IDENT", "Expected component name");
    const componentName = typeToken.value;

    // Validate component exists in catalog
    const schema = this.catalog.schema.components[componentName];
    if (!schema) {
      throw new ParseError(
        `Unknown component: '${componentName}'. Available: ${Object.keys(this.catalog.schema.components).join(", ")}`,
        typeToken.line,
        typeToken.column
      );
    }

    // Parse props if present
    let props: Record<string, unknown> = {};
    let visible: Expression | undefined;
    if (this.check("LPAREN")) {
      const parsed = this.parsePropsWithVisible(componentName, schema);
      props = parsed.props;
      visible = parsed.visible;
    }

    // Parse action or children if present
    let onClick: ActionCall | undefined;
    let onSubmit: ActionCall | undefined;
    let children: UIElement[] | undefined;

    if (this.check("LBRACE")) {
      this.advance(); // consume {

      // Peek to see if it's an action or children
      if (this.check("IDENT") && this.isActionKeyword(this.peek().value)) {
        // It's an action block
        const action = this.parseAction();
        if (action.type === "onClick") {
          onClick = action.call;
        } else {
          onSubmit = action.call;
        }
        this.consume("RBRACE", "Expected '}' after action");
      } else {
        // It's children
        if (!schema.children) {
          throw new ParseError(
            `Component '${componentName}' does not accept children`,
            this.peek().line,
            this.peek().column
          );
        }
        children = [];
        while (!this.check("RBRACE") && !this.isAtEnd()) {
          children.push(this.parseElement());
        }
        this.consume("RBRACE", "Expected '}' after children");
      }
    }

    // Validate props against Zod schema
    this.validateProps(componentName, props, schema, typeToken);

    const element: UIElement = { type: componentName };
    if (Object.keys(props).length > 0) {
      element.props = props;
    }
    if (onClick) element.onClick = onClick;
    if (onSubmit) element.onSubmit = onSubmit;
    if (children && children.length > 0) element.children = children;
    if (visible) element.visible = visible;

    return element;
  }

  /**
   * props := "(" propList? ")"
   * propList := prop ("," prop)*
   * prop := IDENT ":" value
   */
  private parseProps(
    componentName: string,
    schema: { props: z.ZodObject<z.ZodRawShape> }
  ): Record<string, unknown> {
    return this.parsePropsWithVisible(componentName, schema).props;
  }

  /**
   * Parse props including the special "visible" prop which is an Expression.
   * Returns both regular props and the visible expression separately.
   */
  private parsePropsWithVisible(
    componentName: string,
    schema: { props: z.ZodObject<z.ZodRawShape> }
  ): { props: Record<string, unknown>; visible?: Expression } {
    this.consume("LPAREN", "Expected '('");

    const props: Record<string, unknown> = {};
    let visible: Expression | undefined;

    if (!this.check("RPAREN")) {
      do {
        const keyToken = this.consume("IDENT", "Expected property name");
        const key = keyToken.value;

        // Handle the special "visible" prop
        if (key === "visible") {
          this.consume("COLON", "Expected ':' after property name");
          visible = this.parseExpression();
          continue;
        }

        // Validate prop exists in schema
        const propSchema = schema.props.shape[key];
        if (!propSchema) {
          const validProps = Object.keys(schema.props.shape);
          throw new ParseError(
            `Unknown property '${key}' for component '${componentName}'. Valid props: ${validProps.join(", ")}, visible`,
            keyToken.line,
            keyToken.column
          );
        }

        this.consume("COLON", "Expected ':' after property name");
        props[key] = this.parseValue();
      } while (this.match("COMMA"));
    }

    this.consume("RPAREN", "Expected ')'");
    return { props, visible };
  }

  /**
   * action := ("onClick" | "onSubmit") ":" IDENT args?
   * args := "(" exprList? ")"
   */
  private parseAction(): { type: "onClick" | "onSubmit"; call: ActionCall } {
    const actionToken = this.consume("IDENT", "Expected action name");
    const actionType = actionToken.value as "onClick" | "onSubmit";

    if (actionType !== "onClick" && actionType !== "onSubmit") {
      throw new ParseError(
        `Invalid action '${actionType}'. Expected 'onClick' or 'onSubmit'`,
        actionToken.line,
        actionToken.column
      );
    }

    this.consume("COLON", "Expected ':' after action name");

    const funcToken = this.consume("IDENT", "Expected function name");
    const func = funcToken.value;

    let args: Expression[] | undefined;
    if (this.check("LPAREN")) {
      args = this.parseArgs();
    }

    return {
      type: actionType,
      call: { func, args: args as unknown[] | undefined },
    };
  }

  /**
   * args := "(" (expr ("," expr)*)? ")"
   */
  private parseArgs(): Expression[] {
    this.consume("LPAREN", "Expected '('");
    const args: Expression[] = [];

    if (!this.check("RPAREN")) {
      do {
        args.push(this.parseExpression());
      } while (this.match("COMMA"));
    }

    this.consume("RPAREN", "Expected ')'");
    return args;
  }

  /**
   * expr := literal | var
   * literal := STRING | NUMBER | BOOLEAN
   * var := IDENT
   */
  private parseExpression(): Expression {
    const token = this.peek();

    if (token.type === "STRING" || token.type === "NUMBER" || token.type === "BOOLEAN") {
      this.advance();
      return { kind: "literal", value: this.tokenToValue(token) };
    }

    if (token.type === "IDENT") {
      this.advance();
      return { kind: "var", name: token.value };
    }

    throw new ParseError(
      `Expected expression, got '${token.value}'`,
      token.line,
      token.column
    );
  }

  /**
   * value := STRING | NUMBER | BOOLEAN | IDENT
   */
  private parseValue(): unknown {
    const token = this.peek();

    if (
      token.type === "STRING" ||
      token.type === "NUMBER" ||
      token.type === "BOOLEAN" ||
      token.type === "IDENT"
    ) {
      this.advance();
      return this.tokenToValue(token);
    }

    throw new ParseError(
      `Expected value, got '${token.value}'`,
      token.line,
      token.column
    );
  }

  private tokenToValue(token: Token): unknown {
    switch (token.type) {
      case "STRING":
        return token.value;
      case "NUMBER":
        return parseFloat(token.value);
      case "BOOLEAN":
        return token.value === "true";
      case "IDENT":
        return token.value;
      default:
        return token.value;
    }
  }

  private validateProps(
    componentName: string,
    props: Record<string, unknown>,
    schema: { props: z.ZodObject<z.ZodRawShape> },
    token: Token
  ): void {
    const result = schema.props.safeParse(props);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new ParseError(
        `Invalid props for '${componentName}': ${issues}`,
        token.line,
        token.column
      );
    }
  }

  private isActionKeyword(value: string): boolean {
    return value === "onClick" || value === "onSubmit";
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private check(type: TokenType): boolean {
    return !this.isAtEnd() && this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.tokens[this.pos - 1];
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new ParseError(message, token.line, token.column);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a UI DSL string into a UIElement.
 * Validates component names and props against the catalog.
 * 
 * @example
 * ```typescript
 * const catalog = createCatalog({
 *   components: {
 *     Text: { props: z.object({ content: z.string() }) },
 *     Button: { props: z.object({ label: z.string() }), action: true },
 *     Card: { props: z.object({}), children: true },
 *   }
 * });
 * 
 * const ui = parseUI(catalog, `
 *   Card {
 *     Text(content: "Hello!")
 *     Button(label: "Click me") { onClick: handleClick }
 *   }
 * `);
 * ```
 */
export function parseUI(catalog: Catalog, input: string): UIElement {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens, catalog);
  const elements = parser.parse();

  if (elements.length === 0) {
    throw new ParseError("Expected at least one element", 1, 1);
  }

  if (elements.length === 1) {
    return elements[0];
  }

  // If multiple root elements, wrap in a Column
  // (or we could throw an error - depends on desired behavior)
  return {
    type: "Column",
    children: elements,
  };
}

/**
 * Parse multiple UI elements from a DSL string.
 */
export function parseUIElements(catalog: Catalog, input: string): UIElement[] {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens, catalog);
  return parser.parse();
}
