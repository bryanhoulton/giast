import { testCompiler } from './test-compiler.js';

// Run the compiler test
console.log("Testing giast tokenizer and parser...\n");

try {
  testCompiler();
  console.log("\n✅ All tests passed!");
} catch (error) {
  console.error("\n❌ Test failed:", error);
}
