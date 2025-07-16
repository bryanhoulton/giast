#!/usr/bin/env node

import { readFileSync } from 'fs';

import { compile } from './compiler.js';
import { Parser } from './parser.js';
import {
  testCompiler,
  testTokenizer,
} from './test-compiler.js';
import { testExamples } from './test-examples.js';
import { Tokenizer } from './tokenizer.js';

function printUsage() {
  console.log(`
Usage: gaist <command> [options]

Commands:
  compile <file>     Compile a .gaist file and output the AST as JSON
  tokenize <file>    Tokenize a .gaist file and output the tokens
  parse <file>       Parse a .gaist file and output the AST
  test               Run the built-in test suite
  examples           Test all examples against their expected ASTs
  help               Show this help message

Examples:
  gaist compile app.gaist
  gaist tokenize app.gaist
  gaist parse app.gaist
  gaist test
  gaist examples
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const command = args[0];
  const filename = args[1];

  try {
    switch (command) {
      case "compile":
        if (!filename) {
          console.error("Error: Please provide a filename");
          process.exit(1);
        }
        const sourceCode = readFileSync(filename, "utf8");
        const program = compile(sourceCode);
        console.log(JSON.stringify(program, null, 2));
        break;

      case "tokenize":
        if (!filename) {
          console.error("Error: Please provide a filename");
          process.exit(1);
        }
        const tokenizeSource = readFileSync(filename, "utf8");
        const tokenizer = new Tokenizer(tokenizeSource);
        const tokens = tokenizer.tokenize();
        console.log(JSON.stringify(tokens, null, 2));
        break;

      case "parse":
        if (!filename) {
          console.error("Error: Please provide a filename");
          process.exit(1);
        }
        const parseSource = readFileSync(filename, "utf8");
        const parseTokenizer = new Tokenizer(parseSource);
        const parseTokens = parseTokenizer.tokenize();
        const parser = new Parser(parseTokens);
        const ast = parser.parse();
        console.log(JSON.stringify(ast, null, 2));
        break;

      case "test":
        console.log("Running Gaist test suite...\n");
        testTokenizer();
        console.log("\n");
        testCompiler();
        break;

      case "examples":
        testExamples();
        break;

      case "help":
      case "--help":
      case "-h":
        printUsage();
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
