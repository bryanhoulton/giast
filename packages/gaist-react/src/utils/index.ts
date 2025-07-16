type ClassName = string | undefined | null | false | ClassName[];

export function cn(...classes: ClassName[]) {
  return classes.filter(Boolean).join(" ");
}
