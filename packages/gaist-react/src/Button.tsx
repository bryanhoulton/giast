import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
} from 'react';

import { cn } from './utils/index.js';

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function Button({ onClick, className, children }: ButtonProps) {
  return (
    <button
      className={cn(
        "bg-black border text-white px-2 py-1 rounded-md cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
