import { compile } from './compiler';
import { Tokenizer } from './tokenizer';
// Example giast program
const exampleCode = `
// Example giast program - Counter app
state {
  count = 0;
}

logic {
  function add(x) {
    count = count + x;
  }
  
  function reset() {
    count = 0;
  }
}

init {
  add(1);
}

ui {
  Container {
    Button {
      text: "Click me {{count}}";
      onClick: add(1);
    }
    
    Button {
      text: "Reset";
      onClick: reset();
    }
    
    Text {
      text: "Current count: {{count}}";
    }
  }
}
`;
export function testTokenizer() {
    console.log("=== TOKENIZER TEST ===");
    const tokenizer = new Tokenizer(exampleCode);
    const tokens = tokenizer.tokenize();
    console.log("Tokens:");
    tokens.forEach((token, i) => {
        if (token.type !== "NEWLINE") {
            console.log(`${i}: ${token.type} = "${token.value}" (${token.line}:${token.column})`);
        }
    });
    return tokens;
}
export function testParser() {
    console.log("\n=== PARSER TEST ===");
    try {
        const program = compile(exampleCode);
        console.log("Successfully parsed program:");
        console.log(JSON.stringify(program, null, 2));
        return program;
    }
    catch (error) {
        console.error("Parse error:", error instanceof Error ? error.message : String(error));
        throw error;
    }
}
export function testCompiler() {
    console.log("=== COMPILER TEST ===");
    console.log("Source code:");
    console.log(exampleCode);
    testTokenizer();
    testParser();
    console.log("\n=== COMPILATION COMPLETE ===");
}
