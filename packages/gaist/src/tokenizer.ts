export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  IDENTIFIER = "IDENTIFIER",

  // Keywords
  STATE = "STATE",
  LOGIC = "LOGIC",
  INIT = "INIT",
  FUNCTION = "FUNCTION",
  IF = "IF",
  ELSE = "ELSE",

  // Operators
  ASSIGN = "ASSIGN",
  PLUS = "PLUS",
  MINUS = "MINUS",
  MULTIPLY = "MULTIPLY",
  DIVIDE = "DIVIDE",
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  LESS_THAN = "LESS_THAN",
  LESS_EQUAL = "LESS_EQUAL",
  GREATER_THAN = "GREATER_THAN",
  GREATER_EQUAL = "GREATER_EQUAL",
  AND = "AND",
  OR = "OR",

  // Punctuation
  SEMICOLON = "SEMICOLON",
  COMMA = "COMMA",
  COLON = "COLON",
  LEFT_BRACE = "LEFT_BRACE",
  RIGHT_BRACE = "RIGHT_BRACE",
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",

  // Special
  EOF = "EOF",
  NEWLINE = "NEWLINE",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class TokenizerError extends Error {
  constructor(message: string, line: number, column: number) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = "TokenizerError";
  }
}

export class Tokenizer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  private keywords: Record<string, TokenType> = {
    state: TokenType.STATE,
    logic: TokenType.LOGIC,
    init: TokenType.INIT,
    function: TokenType.FUNCTION,
    if: TokenType.IF,
    else: TokenType.ELSE,
    true: TokenType.BOOLEAN,
    false: TokenType.BOOLEAN,
  };

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (this.position < this.source.length) {
      this.skipWhitespace();

      if (this.position >= this.source.length) {
        break;
      }

      const char = this.source[this.position];

      if (char === "\n") {
        this.addToken(TokenType.NEWLINE, "\n");
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }

      if (this.isDigit(char)) {
        this.tokenizeNumber();
      } else if (char === '"') {
        this.tokenizeString();
      } else if (this.isAlpha(char)) {
        this.tokenizeIdentifier();
      } else if (char === "/" && this.peek() === "/") {
        this.skipComment();
      } else {
        this.tokenizeOperatorOrPunctuation();
      }
    }

    this.addToken(TokenType.EOF, "");
    return this.tokens;
  }

  private advance(): string {
    if (this.position < this.source.length) {
      const char = this.source[this.position];
      this.position++;
      if (char !== "\n") {
        this.column++;
      }
      return char;
    }
    return "\0";
  }

  private peek(offset: number = 1): string {
    const peekPos = this.position + offset;
    if (peekPos >= this.source.length) {
      return "\0";
    }
    return this.source[peekPos];
  }

  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
      } else {
        break;
      }
    }
  }

  private skipComment(): void {
    // Skip the '//'
    this.advance();
    this.advance();

    // Skip until end of line
    while (
      this.position < this.source.length &&
      this.source[this.position] !== "\n"
    ) {
      this.advance();
    }
  }

  private tokenizeNumber(): void {
    const start = this.position;

    while (this.isDigit(this.source[this.position])) {
      this.advance();
    }

    // Handle decimal point
    if (this.source[this.position] === "." && this.isDigit(this.peek())) {
      this.advance(); // consume '.'
      while (this.isDigit(this.source[this.position])) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.NUMBER, value);
  }

  private tokenizeString(): void {
    this.advance(); // consume opening quote

    let value = "";

    while (
      this.position < this.source.length &&
      this.source[this.position] !== '"'
    ) {
      const char = this.source[this.position];
      if (char === "\\") {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          default:
            value += escaped;
        }
      } else {
        value += char;
        this.advance();
      }
    }

    if (this.position >= this.source.length) {
      throw new TokenizerError("Unterminated string", this.line, this.column);
    }

    this.advance(); // consume closing quote

    this.addToken(TokenType.STRING, value);
  }

  private tokenizeIdentifier(): void {
    const start = this.position;

    while (this.isAlphaNumeric(this.source[this.position])) {
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    const tokenType = this.keywords[value] || TokenType.IDENTIFIER;
    this.addToken(tokenType, value);
  }

  private tokenizeOperatorOrPunctuation(): void {
    const char = this.advance();

    switch (char) {
      case "=":
        if (this.source[this.position] === "=") {
          this.advance();
          this.addToken(TokenType.EQUALS, "==");
        } else {
          this.addToken(TokenType.ASSIGN, "=");
        }
        break;
      case "!":
        if (this.source[this.position] === "=") {
          this.advance();
          this.addToken(TokenType.NOT_EQUALS, "!=");
        } else {
          throw new TokenizerError(
            `Unexpected character: ${char}`,
            this.line,
            this.column
          );
        }
        break;
      case "&":
        if (this.source[this.position] === "&") {
          this.advance();
          this.addToken(TokenType.AND, "&&");
        } else {
          throw new TokenizerError(
            `Unexpected character: ${char}`,
            this.line,
            this.column
          );
        }
        break;
      case "|":
        if (this.source[this.position] === "|") {
          this.advance();
          this.addToken(TokenType.OR, "||");
        } else {
          throw new TokenizerError(
            `Unexpected character: ${char}`,
            this.line,
            this.column
          );
        }
        break;
      case "+":
        this.addToken(TokenType.PLUS, "+");
        break;
      case "-":
        this.addToken(TokenType.MINUS, "-");
        break;
      case "*":
        this.addToken(TokenType.MULTIPLY, "*");
        break;
      case "/":
        this.addToken(TokenType.DIVIDE, "/");
        break;
      case "<":
        if (this.source[this.position] === "=") {
          this.advance();
          this.addToken(TokenType.LESS_EQUAL, "<=");
        } else {
          this.addToken(TokenType.LESS_THAN, "<");
        }
        break;
      case ">":
        if (this.source[this.position] === "=") {
          this.advance();
          this.addToken(TokenType.GREATER_EQUAL, ">=");
        } else {
          this.addToken(TokenType.GREATER_THAN, ">");
        }
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON, ";");
        break;
      case ",":
        this.addToken(TokenType.COMMA, ",");
        break;
      case ":":
        this.addToken(TokenType.COLON, ":");
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE, "{");
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE, "}");
        break;
      case "(":
        this.addToken(TokenType.LEFT_PAREN, "(");
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN, ")");
        break;
      default:
        throw new TokenizerError(
          `Unexpected character: ${char}`,
          this.line,
          this.column
        );
    }
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    });
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      char === "_"
    );
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
