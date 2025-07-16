import { SPEC_VERSION, } from './grammar';
import { TokenType, } from './tokenizer';
export class ParseError extends Error {
    constructor(message, token) {
        super(token
            ? `${message} at line ${token.line}, column ${token.column}`
            : message);
        this.name = "ParseError";
    }
}
export class Parser {
    constructor(tokens) {
        Object.defineProperty(this, "tokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "current", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.tokens = tokens;
    }
    parse() {
        const program = {
            spec: SPEC_VERSION,
            state: { vars: [] },
            logic: { funcs: [] },
            init: [],
            ui: { type: "Container", children: [] },
        };
        while (!this.isAtEnd()) {
            this.skipNewlines();
            if (this.isAtEnd())
                break;
            if (this.match(TokenType.STATE)) {
                program.state = this.parseState();
            }
            else if (this.match(TokenType.LOGIC)) {
                program.logic = this.parseLogic();
            }
            else if (this.match(TokenType.INIT)) {
                program.init = this.parseInit();
            }
            else if (this.match(TokenType.UI)) {
                program.ui = this.parseUI();
            }
            else {
                throw new ParseError(`Unexpected token: ${this.peek().value}`, this.peek());
            }
        }
        return program;
    }
    parseState() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'state'");
        this.skipNewlines();
        const vars = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.match(TokenType.IDENTIFIER)) {
                const name = this.previous().value;
                this.consume(TokenType.ASSIGN, "Expected '=' after variable name");
                const init = this.parseExpression();
                this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");
                vars.push({ name, init });
            }
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after state block");
        return { vars };
    }
    parseLogic() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'logic'");
        this.skipNewlines();
        const funcs = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.match(TokenType.FUNCTION)) {
                funcs.push(this.parseFunction());
            }
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after logic block");
        return { funcs };
    }
    parseFunction() {
        const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value;
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
        const params = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
                params.push({ name: paramName });
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
        this.consume(TokenType.LEFT_BRACE, "Expected '{' before function body");
        this.skipNewlines();
        const body = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            body.push(this.parseStatement());
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after function body");
        return { name, params, body };
    }
    parseInit() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'init'");
        this.skipNewlines();
        const statements = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after init block");
        return statements;
    }
    parseUI() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'ui'");
        this.skipNewlines();
        const ui = this.parseUINode();
        this.skipNewlines();
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after ui block");
        return ui;
    }
    parseUINode() {
        if (this.match(TokenType.BUTTON)) {
            return this.parseButton();
        }
        else if (this.match(TokenType.TEXT)) {
            return this.parseText();
        }
        else if (this.match(TokenType.CONTAINER)) {
            return this.parseContainer();
        }
        else if (this.match(TokenType.COLUMN)) {
            return this.parseColumn();
        }
        else {
            throw new ParseError(`Expected UI component, got: ${this.peek().value}`, this.peek());
        }
    }
    parseButton() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'Button'");
        this.skipNewlines();
        let text = "";
        let onClick;
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.match(TokenType.IDENTIFIER)) {
                const prop = this.previous().value;
                this.consume(TokenType.COLON, "Expected ':' after property name");
                if (prop === "text") {
                    const textToken = this.consume(TokenType.STRING, "Expected string for text property");
                    text = textToken.value;
                    this.consume(TokenType.SEMICOLON, "Expected ';' after property");
                }
                else if (prop === "onClick") {
                    onClick = this.parseOnClick();
                }
                else {
                    throw new ParseError(`Unknown Button property: ${prop}`, this.previous());
                }
            }
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after Button");
        return { type: "Button", text, onClick };
    }
    parseText() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'Text'");
        this.skipNewlines();
        let text = "";
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.match(TokenType.IDENTIFIER)) {
                const prop = this.previous().value;
                this.consume(TokenType.COLON, "Expected ':' after property name");
                if (prop === "text") {
                    const textToken = this.consume(TokenType.STRING, "Expected string for text property");
                    text = textToken.value;
                }
                else {
                    throw new ParseError(`Unknown Text property: ${prop}`, this.previous());
                }
                this.consume(TokenType.SEMICOLON, "Expected ';' after property");
            }
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after Text");
        return { type: "Text", text };
    }
    parseContainer() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'Container'");
        this.skipNewlines();
        const children = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            children.push(this.parseUINode());
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after Container");
        return { type: "Container", children };
    }
    parseColumn() {
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'Column'");
        this.skipNewlines();
        const children = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            children.push(this.parseUINode());
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after Column");
        return { type: "Column", children };
    }
    parseOnClick() {
        if (this.check(TokenType.LEFT_BRACE)) {
            // Multiple statements
            this.advance();
            this.skipNewlines();
            const statements = [];
            while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                statements.push(this.parseStatement());
                this.skipNewlines();
            }
            this.consume(TokenType.RIGHT_BRACE, "Expected '}' after onClick block");
            return statements;
        }
        else {
            // Single statement
            return this.parseStatement();
        }
    }
    parseStatement() {
        if (this.match(TokenType.IF)) {
            return this.parseIfStatement();
        }
        else if (this.check(TokenType.IDENTIFIER)) {
            // Could be assignment or function call
            const lookahead = this.peekNext();
            if (lookahead && lookahead.type === TokenType.ASSIGN) {
                return this.parseAssignment();
            }
            else if (lookahead && lookahead.type === TokenType.LEFT_PAREN) {
                return this.parseFunctionCall();
            }
            else {
                throw new ParseError(`Unexpected token after identifier: ${lookahead?.value}`, lookahead);
            }
        }
        else {
            throw new ParseError(`Unexpected token in statement: ${this.peek().value}`, this.peek());
        }
    }
    parseIfStatement() {
        const cond = this.parseExpression();
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after if condition");
        this.skipNewlines();
        const thenStmts = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            thenStmts.push(this.parseStatement());
            this.skipNewlines();
        }
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after if body");
        let elseStmts;
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
    parseAssignment() {
        const target = this.consume(TokenType.IDENTIFIER, "Expected variable name").value;
        this.consume(TokenType.ASSIGN, "Expected '=' in assignment");
        const expr = this.parseExpression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");
        return { kind: "assign", target, expr };
    }
    parseFunctionCall() {
        const func = this.consume(TokenType.IDENTIFIER, "Expected function name").value;
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
        const args = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        this.consume(TokenType.SEMICOLON, "Expected ';' after function call");
        return { kind: "call", func, args };
    }
    parseExpression() {
        return this.parseLogicalOr();
    }
    parseLogicalOr() {
        let expr = this.parseLogicalAnd();
        while (this.match(TokenType.OR)) {
            const op = this.previous().value;
            const right = this.parseLogicalAnd();
            expr = { kind: "binary", op, left: expr, right };
        }
        return expr;
    }
    parseLogicalAnd() {
        let expr = this.parseEquality();
        while (this.match(TokenType.AND)) {
            const op = this.previous().value;
            const right = this.parseEquality();
            expr = { kind: "binary", op, left: expr, right };
        }
        return expr;
    }
    parseEquality() {
        let expr = this.parseComparison();
        while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
            const op = this.previous().value;
            const right = this.parseComparison();
            expr = { kind: "binary", op, left: expr, right };
        }
        return expr;
    }
    parseComparison() {
        let expr = this.parseTerm();
        while (this.match(TokenType.PLUS, TokenType.MINUS)) {
            const op = this.previous().value;
            const right = this.parseTerm();
            expr = { kind: "binary", op, left: expr, right };
        }
        return expr;
    }
    parseTerm() {
        let expr = this.parseFactor();
        while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
            const op = this.previous().value;
            const right = this.parseFactor();
            expr = { kind: "binary", op, left: expr, right };
        }
        return expr;
    }
    parseFactor() {
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
    skipNewlines() {
        while (this.match(TokenType.NEWLINE)) {
            // Skip newlines
        }
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    peekNext() {
        if (this.current + 1 >= this.tokens.length)
            return undefined;
        return this.tokens[this.current + 1];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    consume(type1, type2OrMessage, message) {
        if (typeof type2OrMessage === "string") {
            // Single token type
            if (this.check(type1)) {
                return this.advance();
            }
            throw new ParseError(type2OrMessage, this.peek());
        }
        else {
            // Multiple token types
            if (this.check(type1) || this.check(type2OrMessage)) {
                return this.advance();
            }
            throw new ParseError(message, this.peek());
        }
    }
}
