import type { ReactNode } from "react";
import type { Stmt } from "./types.js";

// ============================================================================
// Component Props Types
// ============================================================================

export interface TextComponentProps {
  children: ReactNode;
  variant?: "default" | "muted" | "heading" | "label";
}

export interface ButtonComponentProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  onClick?: () => void;
}

export interface InputComponentProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export interface CardComponentProps {
  children: ReactNode;
}

export interface ColumnComponentProps {
  children: ReactNode;
  gap?: "none" | "sm" | "md" | "lg";
}

export interface RowComponentProps {
  children: ReactNode;
  gap?: "none" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end";
}

export interface BadgeComponentProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}

export interface DividerComponentProps {}

export interface ContainerComponentProps {
  children: ReactNode;
}

// ============================================================================
// Component Registry
// ============================================================================

export interface ComponentRegistry {
  Text: React.ComponentType<TextComponentProps>;
  Button: React.ComponentType<ButtonComponentProps>;
  Input: React.ComponentType<InputComponentProps>;
  Card: React.ComponentType<CardComponentProps>;
  Column: React.ComponentType<ColumnComponentProps>;
  Row: React.ComponentType<RowComponentProps>;
  Badge: React.ComponentType<BadgeComponentProps>;
  Divider: React.ComponentType<DividerComponentProps>;
  Container: React.ComponentType<ContainerComponentProps>;
}

// ============================================================================
// Default (unstyled) Components
// ============================================================================

const DefaultText: React.FC<TextComponentProps> = ({ children }) => (
  <p>{children}</p>
);

const DefaultButton: React.FC<ButtonComponentProps> = ({ children, onClick }) => (
  <button onClick={onClick}>{children}</button>
);

const DefaultInput: React.FC<InputComponentProps> = ({ value, onChange, onSubmit, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
    placeholder={placeholder}
  />
);

const DefaultCard: React.FC<CardComponentProps> = ({ children }) => (
  <div>{children}</div>
);

const DefaultColumn: React.FC<ColumnComponentProps> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
);

const DefaultRow: React.FC<RowComponentProps> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "row" }}>{children}</div>
);

const DefaultBadge: React.FC<BadgeComponentProps> = ({ children }) => (
  <span>{children}</span>
);

const DefaultDivider: React.FC<DividerComponentProps> = () => (
  <hr />
);

const DefaultContainer: React.FC<ContainerComponentProps> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center" }}>{children}</div>
);

export const defaultComponents: ComponentRegistry = {
  Text: DefaultText,
  Button: DefaultButton,
  Input: DefaultInput,
  Card: DefaultCard,
  Column: DefaultColumn,
  Row: DefaultRow,
  Badge: DefaultBadge,
  Divider: DefaultDivider,
  Container: DefaultContainer,
};
