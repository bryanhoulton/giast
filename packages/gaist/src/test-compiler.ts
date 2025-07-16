import { compile } from './compiler.js';
import { Tokenizer } from './tokenizer.js';

// Example gaist program (UI-agnostic)
const exampleCode = `
// Example gaist program - Counter app
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
`;

export function testTokenizer() {
  console.log("=== TOKENIZER TEST ===");
  const tokenizer = new Tokenizer(exampleCode);
  const tokens = tokenizer.tokenize();

  console.log("Tokens:");
  tokens.forEach((token, i) => {
    if (token.type !== "NEWLINE") {
      console.log(
        `${i}: ${token.type} = "${token.value}" (${token.line}:${token.column})`
      );
    }
  });

  return tokens;
}

export function testCompiler() {
  console.log("=== COMPILER TEST ===");
  console.log("Source code:");
  console.log(exampleCode);

  try {
    const program = compile(exampleCode);
    console.log("\nParsed program:");
    console.log(JSON.stringify(program, null, 2));
    console.log("\n✅ Compilation successful!");
  } catch (error) {
    console.error("\n❌ Compilation failed:");
    console.error(error);
  }
}
