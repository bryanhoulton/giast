export var TokenType;
(function (TokenType) {
    // Literals
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["BOOLEAN"] = "BOOLEAN";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    // Keywords
    TokenType["STATE"] = "STATE";
    TokenType["LOGIC"] = "LOGIC";
    TokenType["INIT"] = "INIT";
    TokenType["UI"] = "UI";
    TokenType["FUNCTION"] = "FUNCTION";
    TokenType["IF"] = "IF";
    TokenType["ELSE"] = "ELSE";
    // UI Components
    TokenType["BUTTON"] = "BUTTON";
    TokenType["TEXT"] = "TEXT";
    TokenType["CONTAINER"] = "CONTAINER";
    TokenType["COLUMN"] = "COLUMN";
    // Operators
    TokenType["ASSIGN"] = "ASSIGN";
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["MULTIPLY"] = "MULTIPLY";
    TokenType["DIVIDE"] = "DIVIDE";
    TokenType["EQUALS"] = "EQUALS";
    TokenType["NOT_EQUALS"] = "NOT_EQUALS";
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    // Punctuation
    TokenType["SEMICOLON"] = "SEMICOLON";
    TokenType["COMMA"] = "COMMA";
    TokenType["COLON"] = "COLON";
    TokenType["LEFT_BRACE"] = "LEFT_BRACE";
    TokenType["RIGHT_BRACE"] = "RIGHT_BRACE";
    TokenType["LEFT_PAREN"] = "LEFT_PAREN";
    TokenType["RIGHT_PAREN"] = "RIGHT_PAREN";
    // Special
    TokenType["EOF"] = "EOF";
    TokenType["NEWLINE"] = "NEWLINE";
})(TokenType || (TokenType = {}));
export class TokenizerError extends Error {
    constructor(message, line, column) {
        super(`${message} at line ${line}, column ${column}`);
        this.name = "TokenizerError";
    }
}
export class Tokenizer {
    constructor(source) {
        Object.defineProperty(this, "source", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "position", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "line", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "column", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "tokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "keywords", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                state: TokenType.STATE,
                logic: TokenType.LOGIC,
                init: TokenType.INIT,
                ui: TokenType.UI,
                function: TokenType.FUNCTION,
                if: TokenType.IF,
                else: TokenType.ELSE,
                true: TokenType.BOOLEAN,
                false: TokenType.BOOLEAN,
                Button: TokenType.BUTTON,
                Text: TokenType.TEXT,
                Container: TokenType.CONTAINER,
                Column: TokenType.COLUMN,
            }
        });
        this.source = source;
    }
    tokenize() {
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
            }
            else if (char === '"') {
                this.tokenizeString();
            }
            else if (this.isAlpha(char)) {
                this.tokenizeIdentifier();
            }
            else if (char === "/" && this.peek() === "/") {
                this.skipComment();
            }
            else {
                this.tokenizeOperatorOrPunctuation();
            }
        }
        this.addToken(TokenType.EOF, "");
        return this.tokens;
    }
    advance() {
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
    peek(offset = 1) {
        const peekPos = this.position + offset;
        if (peekPos >= this.source.length) {
            return "\0";
        }
        return this.source[peekPos];
    }
    skipWhitespace() {
        while (this.position < this.source.length) {
            const char = this.source[this.position];
            if (char === " " || char === "\t" || char === "\r") {
                this.advance();
            }
            else {
                break;
            }
        }
    }
    skipComment() {
        // Skip the '//'
        this.advance();
        this.advance();
        // Skip until end of line
        while (this.position < this.source.length &&
            this.source[this.position] !== "\n") {
            this.advance();
        }
    }
    tokenizeNumber() {
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
    tokenizeString() {
        this.advance(); // consume opening quote
        let value = "";
        while (this.position < this.source.length &&
            this.source[this.position] !== '"') {
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
            }
            else {
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
    tokenizeIdentifier() {
        const start = this.position;
        while (this.isAlphaNumeric(this.source[this.position])) {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        const tokenType = this.keywords[value] || TokenType.IDENTIFIER;
        this.addToken(tokenType, value);
    }
    tokenizeOperatorOrPunctuation() {
        const char = this.advance();
        switch (char) {
            case "=":
                if (this.source[this.position] === "=") {
                    this.advance();
                    this.addToken(TokenType.EQUALS, "==");
                }
                else {
                    this.addToken(TokenType.ASSIGN, "=");
                }
                break;
            case "!":
                if (this.source[this.position] === "=") {
                    this.advance();
                    this.addToken(TokenType.NOT_EQUALS, "!=");
                }
                else {
                    throw new TokenizerError(`Unexpected character: ${char}`, this.line, this.column);
                }
                break;
            case "&":
                if (this.source[this.position] === "&") {
                    this.advance();
                    this.addToken(TokenType.AND, "&&");
                }
                else {
                    throw new TokenizerError(`Unexpected character: ${char}`, this.line, this.column);
                }
                break;
            case "|":
                if (this.source[this.position] === "|") {
                    this.advance();
                    this.addToken(TokenType.OR, "||");
                }
                else {
                    throw new TokenizerError(`Unexpected character: ${char}`, this.line, this.column);
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
                throw new TokenizerError(`Unexpected character: ${char}`, this.line, this.column);
        }
    }
    addToken(type, value) {
        this.tokens.push({
            type,
            value,
            line: this.line,
            column: this.column - value.length,
        });
    }
    isDigit(char) {
        return char >= "0" && char <= "9";
    }
    isAlpha(char) {
        return ((char >= "a" && char <= "z") ||
            (char >= "A" && char <= "Z") ||
            char === "_");
    }
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }
}
