# Giast Language - Tokenizer and Parser

This directory contains the tokenizer and parser for the giast language, a domain-specific language for building interactive UI applications with state management.

## Overview

The giast language is designed to be a declarative way to describe:

- Application state (variables and their initial values)
- Logic (pure functions that manipulate state)
- Initialization code (code to run when the app starts)
- UI components (reactive user interface elements)

## Files

- `tokenizer.ts` - Converts source code into tokens
- `parser.ts` - Converts tokens into Abstract Syntax Tree (AST)
- `compiler.ts` - Main entry point that combines tokenizer and parser
- `grammar.ts` - TypeScript definitions for the AST structure
- `test-compiler.ts` - Test utilities and examples
- `example.giast` - Example program in giast syntax

## Language Syntax

### Basic Structure

A giast program consists of four main sections:

```giast
state {
  // Variable declarations
}

logic {
  // Function definitions
}

init {
  // Initialization code
}

ui {
  // UI component tree
}
```

### State Section

Declare variables and their initial values:

```giast
state {
  count = 0;
  name = "Hello";
  isActive = true;
}
```

### Logic Section

Define pure functions that can modify state:

```giast
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

```giast
init {
  increment(1);
}
```

### UI Section

Declare the user interface using components:

```giast
ui {
  Container {
    Button {
      text: "Click me {{count}}";
      onClick: increment(1);
    }

    Text {
      text: "Current value: {{count}}";
    }
  }
}
```

## Supported Features

### Expressions

- Literals: numbers, strings, booleans
- Variables: reference to state variables or function parameters
- Binary operations: `+`, `-`, `*`, `/`, `==`, `!=`, `&&`, `||`
- Template strings: `"Hello {{name}}"` for interpolation

### Statements

- Assignment: `variable = expression;`
- Function calls: `functionName(arg1, arg2);`
- If statements: `if condition { ... } else { ... }`

### UI Components

- `Container` - Generic container for other components
- `Column` - Vertical layout container
- `Button` - Interactive button with text and onClick handler
- `Text` - Static text display

## Usage

### Basic Compilation

```typescript
import { compile } from "./compiler";

const sourceCode = `
state {
  count = 0;
}

logic {
  function add(x) {
    count = count + x;
  }
}

ui {
  Button {
    text: "Count: {{count}}";
    onClick: add(1);
  }
}
`;

const program = compile(sourceCode);
// Returns Program AST that can be executed by the runtime
```

### Using Individual Components

```typescript
import { Tokenizer, Parser } from "./compiler";

// Tokenize source code
const tokenizer = new Tokenizer(sourceCode);
const tokens = tokenizer.tokenize();

// Parse tokens into AST
const parser = new Parser(tokens);
const program = parser.parse();
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

## Testing

Run the test suite to see the tokenizer and parser in action:

```typescript
import { testCompiler } from "./test-compiler";

testCompiler();
```

This will show:

1. The original source code
2. The tokens produced by the tokenizer
3. The AST produced by the parser
4. Success/failure status

## Integration with Runtime

The parsed AST can be used directly with the existing runtime system:

```typescript
import { compile } from "./giast/compiler";
import { RuntimeComponent } from "./giast/runtime/component";

const sourceCode = `/* your giast code */`;
const program = compile(sourceCode);

// Use with React component
<RuntimeComponent config={{ program }} />;
```

## Grammar Reference

The complete grammar is defined in `grammar.ts` and includes:

- `Program` - Root node containing all sections
- `State` - Variable declarations
- `Logic` - Function definitions
- `Expr` - Expressions (literals, variables, binary operations)
- `Stmt` - Statements (assignments, calls, if statements)
- `UINode` - UI component definitions

## Future Enhancements

Potential future features:

- More UI components (Input, List, etc.)
- Loops and iteration
- Objects and arrays
- Import/export system
- Type annotations
