import type { RenderContext, CatalogComponentRegistry } from "gaist-react";

// ============================================================================
// Utility
// ============================================================================

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// Style Maps
// ============================================================================

const textVariants: Record<string, string> = {
  default: "text-gray-900 text-sm",
  muted: "text-gray-500 text-sm",
  heading: "text-gray-900 text-lg font-semibold tracking-tight",
  label: "text-gray-700 text-sm font-medium",
};

const buttonVariants: Record<string, string> = {
  default: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  outline: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
  ghost: "text-gray-900 hover:bg-gray-100",
  destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
};

const buttonSizes: Record<string, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6 text-base",
};

const gapSizes: Record<string, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const alignClasses: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

const badgeVariants: Record<string, string> = {
  default: "bg-gray-900 text-white",
  secondary: "bg-gray-100 text-gray-900",
  outline: "border border-gray-200 text-gray-900 bg-transparent",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  destructive: "bg-red-100 text-red-800",
};

// ============================================================================
// Components
// ============================================================================

export const components: CatalogComponentRegistry = {
  Card: ({ element, children }: RenderContext) => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {element.props.title && (
        <h3 className="text-lg font-semibold mb-4">{element.props.title as string}</h3>
      )}
      {children}
    </div>
  ),

  Column: ({ element, children }: RenderContext) => {
    const gap = (element.props.gap as string) || "md";
    return (
      <div className={cn("flex flex-col", gapSizes[gap] || gapSizes.md)}>
        {children}
      </div>
    );
  },

  Row: ({ element, children }: RenderContext) => {
    const gap = (element.props.gap as string) || "md";
    const align = (element.props.align as string) || "center";
    return (
      <div
        className={cn(
          "flex flex-row",
          gapSizes[gap] || gapSizes.md,
          alignClasses[align] || alignClasses.center
        )}
      >
        {children}
      </div>
    );
  },

  Text: ({ element }: RenderContext) => {
    const variant = (element.props.variant as string) || "default";
    return (
      <p className={textVariants[variant] || textVariants.default}>
        {element.props.content as string}
      </p>
    );
  },

  Button: ({ element, onAction }: RenderContext) => {
    const variant = (element.props.variant as string) || "default";
    const size = (element.props.size as string) || "default";
    return (
      <button
        onClick={onAction}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400",
          "disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant] || buttonVariants.default,
          buttonSizes[size] || buttonSizes.default
        )}
      >
        {element.props.label as string}
      </button>
    );
  },

  Input: ({ element, state, setState, onAction }: RenderContext) => {
    const bind = element.props.bind as string;
    const value = bind ? (state[bind] as string) ?? "" : "";
    const type = (element.props.type as string) || "text";
    return (
      <input
        type={type}
        value={value}
        onChange={(e) => bind && setState(bind, e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAction?.()}
        placeholder={element.props.placeholder as string}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm",
          "shadow-sm transition-colors placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
    );
  },

  Badge: ({ element }: RenderContext) => {
    const variant = (element.props.variant as string) || "default";
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
          badgeVariants[variant] || badgeVariants.default
        )}
      >
        {element.props.text as string}
      </span>
    );
  },

  Divider: () => <div className="h-px w-full bg-gray-200 my-2" />,
};
