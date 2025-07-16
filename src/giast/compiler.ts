import { Program } from './grammar';
import { Parser } from './parser';
import { Tokenizer } from './tokenizer';

export function compile(source: string): Program {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();

  const parser = new Parser(tokens);
  const program = parser.parse();

  return program;
}

export { Parser, Tokenizer };
export { TokenizerError, TokenType } from './tokenizer';
export { ParseError } from './parser';
