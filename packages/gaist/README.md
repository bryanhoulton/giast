# Gaist Language - Core Compiler and Runtime

This directory contains the core compiler and runtime for the gaist language, a domain-specific language for building applications with state management and logic.

## Overview

The gaist language is designed to be a declarative way to describe:

- Application state (variables and their initial values)
- Logic (pure functions that manipulate state)
- Initialization code (code to run when the app starts)

## Files

- `tokenizer.ts` - Converts source code into tokens
- `parser.ts` - Converts tokens into Abstract Syntax Tree (AST)
- `compiler.ts` - Main entry point that combines tokenizer and parser
- `grammar.ts` - TypeScript definitions for the AST structure
- `runtime.ts` - Core runtime for executing gaist programs
- `scope.ts` - Scope management for variables and functions
- `logger.ts` - Logging utilities
- `cli.ts` - Command-line interface
- `test-compiler.ts` - Test utilities and examples
- `test-examples.ts` - Example validation system
- `examples/` - Example gaist programs with expected ASTs
- `examples/invalid/` - Invalid examples with expected errors

## Language Syntax

### Basic Structure

A gaist program consists of three main sections:

```gaist
state {
  // Variable declarations
}

logic {
  // Function definitions
}

init {
  // Initialization code
}
```

### State Section

Declare variables and their initial values:

```gaist
state {
  count = 0;
  name = "Hello";
  isActive = true;
}
```

### Logic Section

Define pure functions that can modify state:

```gaist
logic {
  function increment(x) {
    count = count + x;
  }

  function reset() {
    count = 0;
  }
}
```

### Init Section

Code to run when the application starts:

```gaist
init {
  increment(1);
}
```

## Examples

The `examples/` directory contains comprehensive examples demonstrating different language features:

### Valid Examples

- **basic-state.gaist** - Simple state declarations
- **counter.gaist** - Counter with logic and initialization
- **expressions.gaist** - Various expression types and operations
- **conditionals.gaist** - If/else statements and comparisons
- **empty-sections.gaist** - Empty sections (valid minimal program)
- **function-params.gaist** - Functions with different parameter patterns

### Invalid Examples (Error Testing)

The `examples/invalid/` directory contains examples that should produce compilation errors:

- **missing-brace.gaist** - Missing opening brace in logic section
- **missing-semicolon.gaist** - Missing semicolon in state declaration
- **unterminated-string.gaist** - Unterminated string literal
- **invalid-character.gaist** - Invalid character in source code
- **unexpected-token.gaist** - Unexpected token in expression
- **malformed-function.gaist** - Malformed function definition
- **unknown-section.gaist** - Unknown section type

Each example has a corresponding `.ast.json` file (for valid examples) or `.error` file (for invalid examples) containing the expected output.

## Supported Features

### Expressions

- Literals: numbers, strings, booleans
- Variables: reference to state variables or function parameters
- Binary operations: `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`
- Template strings: `"Hello {{name}}"` for interpolation

### Statements

- Assignment: `variable = expression;`
- Function calls: `functionName(arg1, arg2);`
- If statements: `if condition { ... } else { ... }`

## Usage

### Basic Compilation

```typescript
import { compile } from "gaist";

const sourceCode = `
state {
  count = 0;
}

logic {
  function add(x) {
    count = count + x;
  }
}

init {
  add(1);
}
`;

const program = compile(sourceCode);
// Returns Program AST that can be executed by the runtime
```

### Using Individual Components

```typescript
import { Tokenizer, Parser } from "gaist";

// Tokenize source code
const tokenizer = new Tokenizer(sourceCode);
const tokens = tokenizer.tokenize();

// Parse tokens into AST
const parser = new Parser(tokens);
const program = parser.parse();
```

### Runtime Execution

```typescript
import { Runtime } from "gaist";

const runtime = new Runtime({ program });
runtime.run(); // Execute the init section
```

## Command Line Interface

The gaist package includes a CLI for working with gaist files:

```bash
# Compile a gaist file to JSON AST
gaist compile app.gaist

# Tokenize a gaist file
gaist tokenize app.gaist

# Parse a gaist file
gaist parse app.gaist

# Run the test suite
gaist test

# Test all examples against their expected ASTs
gaist examples
```

## Testing

### Built-in Tests

Run the compiler test suite:

```bash
yarn test
```

This runs both the basic compiler tests and validates all examples (including error cases).

### Example Validation

Test all examples against their expected ASTs and error messages:

```bash
gaist examples
# or
yarn test:examples
```

The test suite includes:

- **6 valid examples** that should compile successfully
- **7 error cases** that should produce specific error messages

### Error Message Testing

The error testing system verifies that:

- Invalid syntax produces appropriate error messages
- Errors include correct line and column information
- Error messages are helpful and descriptive

Example error messages:

- `Unterminated string at line 3, column 44`
- `Expected parameter name at line 7, column 18`
- `Unexpected token: @ at line 4, column 17`

### Manual Testing

```typescript
import { testCompiler, testExamples } from "gaist";

// Test the basic compiler functionality
testCompiler();

// Test all examples (valid and invalid)
testExamples();
```

## Error Handling

The compiler provides detailed error messages with line and column information:

```typescript
try {
  const program = compile(sourceCode);
} catch (error) {
  if (error instanceof TokenizerError) {
    console.error("Tokenizer error:", error.message);
  } else if (error instanceof ParseError) {
    console.error("Parse error:", error.message);
  }
}
```

## Grammar Reference

The complete grammar is defined in `grammar.ts` and includes:

- `Program` - Root node containing all sections
- `State` - Variable declarations
- `Logic` - Function definitions
- `Expr` - Expressions (literals, variables, binary operations)
- `Stmt` - Statements (assignments, calls, if statements)

## UI Integration

For UI functionality, use the `gaist-react` package which provides React components and rendering capabilities on top of the core gaist runtime.

## Future Enhancements

Potential future features:

- Loops and iteration
- Objects and arrays
- Import/export system
- Type annotations
- More built-in functions
