import {
  BinOp,
  Expr,
  Func,
  FuncParam,
  Logic,
  Program,
  SPEC_VERSION,
  State,
  StateVar,
  Stmt,
} from './grammar.js';
import {
  Token,
  TokenType,
} from './tokenizer.js';

export class ParseError extends Error {
  constructor(message: string, token?: Token) {
    super(
      token
        ? `${message} at line ${token.line}, column ${token.column}`
        : message
    );
    this.name = "ParseError";
  }
}

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const program: Program = {
      spec: SPEC_VERSION,
      state: { vars: [] },
      logic: { funcs: [] },
      init: [],
    };

    while (!this.isAtEnd()) {
      this.skipNewlines();

      if (this.isAtEnd()) break;

      if (this.match(TokenType.STATE)) {
        program.state = this.parseState();
      } else if (this.match(TokenType.LOGIC)) {
        program.logic = this.parseLogic();
      } else if (this.match(TokenType.INIT)) {
        program.init = this.parseInit();
      } else if (this.match(TokenType.UI)) {
        // UI section is parsed separately by gaist-react's parseUI function
        // Skip the UI block for now
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'ui'");
        let braceDepth = 1;
        while (!this.isAtEnd() && braceDepth > 0) {
          if (this.peek().type === TokenType.LEFT_BRACE) braceDepth++;
          if (this.peek().type === TokenType.RIGHT_BRACE) braceDepth--;
          this.advance();
        }
      } else {
        throw new ParseError(
          `Unexpected token: ${this.peek().value}`,
          this.peek()
        );
      }
    }

    return program;
  }

  private parseState(): State {
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'state'");
    this.skipNewlines();

    const vars: StateVar[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.IDENTIFIER)) {
        const name = this.previous().value;
        this.consume(TokenType.ASSIGN, "Expected '=' after variable name");
        const init = this.parseExpression();
        this.consume(
          TokenType.SEMICOLON,
          "Expected ';' after variable declaration"
        );
        vars.push({ name, init });
      }
      this.skipNewlines();
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after state block");
    return { vars };
  }

  private parseLogic(): Logic {
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'logic'");
    this.skipNewlines();

    const funcs: Func[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.FUNCTION)) {
        funcs.push(this.parseFunction());
      }
      this.skipNewlines();
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after logic block");
    return { funcs };
  }

  private parseFunction(): Func {
    const name = this.consume(
      TokenType.IDENTIFIER,
      "Expected function name"
    ).value;

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");

    const params: FuncParam[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const paramName = this.consume(
          TokenType.IDENTIFIER,
          "Expected parameter name"
        ).value;
        params.push({ name: paramName });
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before function body");
    this.skipNewlines();

    const body: Stmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after function body");

    return { name, params, body };
  }

  private parseInit(): Stmt[] {
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'init'");
    this.skipNewlines();

    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
      this.skipNewlines();
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after init block");
    return statements;
  }

  private parseStatement(): Stmt {
    if (this.match(TokenType.IF)) {
      return this.parseIfStatement();
    } else if (this.check(TokenType.IDENTIFIER)) {
      // Could be assignment or function call
      const lookahead = this.peekNext();
      if (lookahead && lookahead.type === TokenType.ASSIGN) {
        return this.parseAssignment();
      } else if (lookahead && lookahead.type === TokenType.LEFT_PAREN) {
        return this.parseFunctionCall();
      } else {
        throw new ParseError(
          `Unexpected token after identifier: ${lookahead?.value}`,
          lookahead
        );
      }
    } else {
      throw new ParseError(
        `Unexpected token in statement: ${this.peek().value}`,
        this.peek()
      );
    }
  }

  private parseIfStatement(): Stmt {
    const cond = this.parseExpression();
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after if condition");
    this.skipNewlines();

    const thenStmts: Stmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      thenStmts.push(this.parseStatement());
      this.skipNewlines();
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after if body");

    let elseStmts: Stmt[] | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.LEFT_BRACE, "Expected '{' after else");
      this.skipNewlines();

      elseStmts = [];
      while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
        elseStmts.push(this.parseStatement());
        this.skipNewlines();
      }

      this.consume(TokenType.RIGHT_BRACE, "Expected '}' after else body");
    }

    return { kind: "if", cond, then: thenStmts, else: elseStmts };
  }

  private parseAssignment(): Stmt {
    const target = this.consume(
      TokenType.IDENTIFIER,
      "Expected variable name"
    ).value;
    this.consume(TokenType.ASSIGN, "Expected '=' in assignment");
    const expr = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

    return { kind: "assign", target, expr };
  }

  private parseFunctionCall(): Stmt {
    const func = this.consume(
      TokenType.IDENTIFIER,
      "Expected function name"
    ).value;
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");

    const args: Expr[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
    this.consume(TokenType.SEMICOLON, "Expected ';' after function call");

    return { kind: "call", func, args };
  }

  private parseExpression(): Expr {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expr {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const op = this.previous().value as BinOp;
      const right = this.parseLogicalAnd();
      expr = { kind: "binary", op, left: expr, right };
    }

    return expr;
  }

  private parseLogicalAnd(): Expr {
    let expr = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const op = this.previous().value as BinOp;
      const right = this.parseEquality();
      expr = { kind: "binary", op, left: expr, right };
    }

    return expr;
  }

  private parseEquality(): Expr {
    let expr = this.parseComparison();

    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const op = this.previous().value as BinOp;
      const right = this.parseComparison();
      expr = { kind: "binary", op, left: expr, right };
    }

    return expr;
  }

  private parseComparison(): Expr {
    let expr = this.parseTerm();

    while (
      this.match(
        TokenType.GREATER_THAN,
        TokenType.GREATER_EQUAL,
        TokenType.LESS_THAN,
        TokenType.LESS_EQUAL
      )
    ) {
      const op = this.previous().value as BinOp;
      const right = this.parseTerm();
      expr = { kind: "binary", op, left: expr, right };
    }

    return expr;
  }

  private parseTerm(): Expr {
    let expr = this.parseFactor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous().value as BinOp;
      const right = this.parseFactor();
      expr = { kind: "binary", op, left: expr, right };
    }

    return expr;
  }

  private parseFactor(): Expr {
    let expr = this.parseUnary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const op = this.previous().value as BinOp;
      const right = this.parseUnary();
      expr = { kind: "binary", op, left: expr, right };
    }

    return expr;
  }

  private parseUnary(): Expr {
    if (this.match(TokenType.NUMBER)) {
      return { kind: "literal", value: Number(this.previous().value) };
    }

    if (this.match(TokenType.STRING)) {
      return { kind: "literal", value: this.previous().value };
    }

    if (this.match(TokenType.BOOLEAN)) {
      return { kind: "literal", value: this.previous().value === "true" };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return { kind: "var", name: this.previous().value };
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    throw new ParseError(`Unexpected token: ${this.peek().value}`, this.peek());
  }

  private skipNewlines(): void {
    while (this.match(TokenType.NEWLINE)) {
      // Skip newlines
    }
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    if (this.current + 1 >= this.tokens.length) return undefined;
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token;
  private consume(type1: TokenType, type2: TokenType, message: string): Token;
  private consume(
    type1: TokenType,
    type2OrMessage: TokenType | string,
    message?: string
  ): Token {
    if (typeof type2OrMessage === "string") {
      // Single token type
      if (this.check(type1)) {
        return this.advance();
      }
      throw new ParseError(type2OrMessage, this.peek());
    } else {
      // Multiple token types
      if (this.check(type1) || this.check(type2OrMessage)) {
        return this.advance();
      }
      throw new ParseError(message!, this.peek());
    }
  }
}
