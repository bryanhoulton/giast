#!/usr/bin/env node
import { readFileSync } from 'fs';

import { compile } from './compiler.js';
import { Program } from './grammar.js';

interface TestCase {
  name: string;
  sourceFile: string;
  expectedASTFile: string;
}

interface ErrorTestCase {
  name: string;
  sourceFile: string;
  expectedErrorFile: string;
}

const testCases: TestCase[] = [
  {
    name: "Basic State",
    sourceFile: "examples/basic-state.gaist",
    expectedASTFile: "examples/basic-state.ast.json",
  },
  {
    name: "Counter",
    sourceFile: "examples/counter.gaist",
    expectedASTFile: "examples/counter.ast.json",
  },
  {
    name: "Expressions",
    sourceFile: "examples/expressions.gaist",
    expectedASTFile: "examples/expressions.ast.json",
  },
  {
    name: "Conditionals",
    sourceFile: "examples/conditionals.gaist",
    expectedASTFile: "examples/conditionals.ast.json",
  },
  {
    name: "Empty Sections",
    sourceFile: "examples/empty-sections.gaist",
    expectedASTFile: "examples/empty-sections.ast.json",
  },
  {
    name: "Function Parameters",
    sourceFile: "examples/function-params.gaist",
    expectedASTFile: "examples/function-params.ast.json",
  },
];

const errorTestCases: ErrorTestCase[] = [
  {
    name: "Missing Brace",
    sourceFile: "examples/invalid/missing-brace.gaist",
    expectedErrorFile: "examples/invalid/missing-brace.error",
  },
  {
    name: "Missing Semicolon",
    sourceFile: "examples/invalid/missing-semicolon.gaist",
    expectedErrorFile: "examples/invalid/missing-semicolon.error",
  },
  {
    name: "Unterminated String",
    sourceFile: "examples/invalid/unterminated-string.gaist",
    expectedErrorFile: "examples/invalid/unterminated-string.error",
  },
  {
    name: "Invalid Character",
    sourceFile: "examples/invalid/invalid-character.gaist",
    expectedErrorFile: "examples/invalid/invalid-character.error",
  },
  {
    name: "Unexpected Token",
    sourceFile: "examples/invalid/unexpected-token.gaist",
    expectedErrorFile: "examples/invalid/unexpected-token.error",
  },
  {
    name: "Malformed Function",
    sourceFile: "examples/invalid/malformed-function.gaist",
    expectedErrorFile: "examples/invalid/malformed-function.error",
  },
  {
    name: "Unknown Section",
    sourceFile: "examples/invalid/unknown-section.gaist",
    expectedErrorFile: "examples/invalid/unknown-section.error",
  },
];

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function runTest(testCase: TestCase): { passed: boolean; error?: string } {
  try {
    // Read and compile the source
    const source = readFileSync(testCase.sourceFile, "utf8");
    const actualAST = compile(source);

    // Read the expected AST
    const expectedASTText = readFileSync(testCase.expectedASTFile, "utf8");
    const expectedAST = JSON.parse(expectedASTText) as Program;

    // Compare
    if (deepEqual(actualAST, expectedAST)) {
      return { passed: true };
    } else {
      return {
        passed: false,
        error: `AST mismatch:\nActual: ${JSON.stringify(
          actualAST,
          null,
          2
        )}\nExpected: ${JSON.stringify(expectedAST, null, 2)}`,
      };
    }
  } catch (error) {
    return {
      passed: false,
      error: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function runErrorTest(testCase: ErrorTestCase): {
  passed: boolean;
  error?: string;
} {
  try {
    // Read and compile the source - this should throw an error
    const source = readFileSync(testCase.sourceFile, "utf8");
    const actualAST = compile(source);

    // If we get here, the test failed because no error was thrown
    return {
      passed: false,
      error: `Expected error but compilation succeeded:\nAST: ${JSON.stringify(
        actualAST,
        null,
        2
      )}`,
    };
  } catch (error) {
    // Read the expected error message
    const expectedError = readFileSync(
      testCase.expectedErrorFile,
      "utf8"
    ).trim();
    const actualError = error instanceof Error ? error.message : String(error);

    // Compare error messages
    if (actualError === expectedError) {
      return { passed: true };
    } else {
      return {
        passed: false,
        error: `Error message mismatch:\nActual: "${actualError}"\nExpected: "${expectedError}"`,
      };
    }
  }
}

export function testExamples(): void {
  console.log("=== TESTING EXAMPLES ===\n");

  let passed = 0;
  let total = testCases.length + errorTestCases.length;

  // Test valid examples
  console.log("🟢 Testing valid examples:");
  for (const testCase of testCases) {
    console.log(`  Testing ${testCase.name}...`);
    const result = runTest(testCase);

    if (result.passed) {
      console.log(`  ✅ PASSED\n`);
      passed++;
    } else {
      console.log(`  ❌ FAILED`);
      console.log(`  ${result.error}`);
      console.log();
    }
  }

  // Test error cases
  console.log("🔴 Testing error cases:");
  for (const testCase of errorTestCases) {
    console.log(`  Testing ${testCase.name}...`);
    const result = runErrorTest(testCase);

    if (result.passed) {
      console.log(`  ✅ PASSED (error correctly caught)\n`);
      passed++;
    } else {
      console.log(`  ❌ FAILED`);
      console.log(`  ${result.error}`);
      console.log();
    }
  }

  console.log(`=== RESULTS ===`);
  console.log(`${passed}/${total} tests passed`);
  console.log(`Valid examples: ${testCases.length}`);
  console.log(`Error cases: ${errorTestCases.length}`);

  if (passed === total) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("❌ Some tests failed");
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testExamples();
}
