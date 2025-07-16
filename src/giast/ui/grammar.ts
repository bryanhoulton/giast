import { Stmt } from '../grammar';

export type TextNode = {
  type: "Text";
  text: string;
};

export type ButtonNode = {
  type: "Button";
  text: string;
  onClick?: Stmt | Stmt[];
};

export type ColumnNode = {
  type: "Column";
  children?: UINode[];
};

export type ContainerNode = {
  type: "Container";
  children?: UINode[];
};

export type UINode = TextNode | ButtonNode | ColumnNode | ContainerNode;
