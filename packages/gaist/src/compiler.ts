import { Program } from './grammar.js';
import { Parser } from './parser.js';
import { Tokenizer } from './tokenizer.js';

export function compile(source: string): Program {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();

  const parser = new Parser(tokens);
  const program = parser.parse();

  return program;
}

export { Parser, Tokenizer };
export { TokenizerError, TokenType } from './tokenizer.js';
export { ParseError } from './parser.js';
