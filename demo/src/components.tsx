import type { RenderContext, ComponentRegistry } from "gaist-react";

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
  default: "bg-gray-100 text-gray-700",
  secondary: "bg-gray-200 text-gray-800",
  outline: "border border-gray-300 text-gray-600 bg-transparent",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  destructive: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const alertVariants: Record<string, string> = {
  default: "bg-gray-50 border-gray-200 text-gray-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

const avatarSizes: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const spacerSizes: Record<string, string> = {
  sm: "h-2",
  md: "h-4",
  lg: "h-8",
  xl: "h-12",
};

// ============================================================================
// Components
// ============================================================================

export const components: ComponentRegistry = {
  Card: ({ element, children }: RenderContext) => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {element.props.title !== undefined && (
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
    const rawValue = bind ? state[bind] : "";
    const type = (element.props.type as string) || "text";
    // For number inputs, show empty string if value is 0 or empty, otherwise show the number
    const displayValue = type === "number" && rawValue === "" ? "" : String(rawValue ?? "");
    return (
      <input
        type={type}
        value={displayValue}
        onChange={(e) => {
          if (!bind) return;
          // Coerce to number when type is "number"
          if (type === "number") {
            const strVal = e.target.value;
            if (strVal === "") {
              setState(bind, ""); // Keep empty string to show placeholder
            } else {
              const num = parseFloat(strVal);
              setState(bind, isNaN(num) ? 0 : num);
            }
          } else {
            setState(bind, e.target.value);
          }
        }}
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
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          badgeVariants[variant] || badgeVariants.default
        )}
      >
        {element.props.text as string}
      </span>
    );
  },

  Divider: () => <div className="h-px w-full bg-gray-200 my-2" />,

  Checkbox: ({ element, state, setState }: RenderContext) => {
    const bind = element.props.bind as string;
    const checked = bind ? Boolean(state[bind]) : false;
    const label = element.props.label as string | undefined;
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => bind && setState(bind, e.target.checked)}
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-gray-900",
            "focus:ring-1 focus:ring-gray-400 focus:ring-offset-0"
          )}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  },

  Switch: ({ element, state, setState }: RenderContext) => {
    const bind = element.props.bind as string;
    const checked = bind ? Boolean(state[bind]) : false;
    const label = element.props.label as string | undefined;
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => bind && setState(bind, !checked)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
            checked ? "bg-gray-900" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
              "transform transition-transform",
              checked ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  },

  Select: ({ element, state, setState }: RenderContext) => {
    const bind = element.props.bind as string;
    const value = bind ? (state[bind] as string) ?? "" : "";
    const placeholder = element.props.placeholder as string | undefined;
    const optionsStr = element.props.options as string;
    const options = optionsStr ? optionsStr.split(",").map((o) => o.trim()) : [];
    return (
      <select
        value={value}
        onChange={(e) => bind && setState(bind, e.target.value)}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm",
          "shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400",
          !value && "text-gray-400"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  },

  Textarea: ({ element, state, setState, onAction }: RenderContext) => {
    const bind = element.props.bind as string;
    const value = bind ? (state[bind] as string) ?? "" : "";
    const rawRows = element.props.rows;
    const rows = typeof rawRows === "string" ? parseInt(rawRows, 10) || 3 : (rawRows as number) || 3;
    return (
      <textarea
        value={value}
        onChange={(e) => bind && setState(bind, e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && onAction?.()}
        rows={rows}
        placeholder={element.props.placeholder as string}
        className={cn(
          "flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm",
          "shadow-sm transition-colors placeholder:text-gray-400 resize-none",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
        )}
      />
    );
  },

  Progress: ({ element }: RenderContext) => {
    const rawValue = element.props.value;
    const rawMax = element.props.max;
    const value = typeof rawValue === "string" ? parseFloat(rawValue) || 0 : (rawValue as number) || 0;
    const max = typeof rawMax === "string" ? parseFloat(rawMax) || 100 : (rawMax as number) || 100;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  },

  Slider: ({ element, state, setState }: RenderContext) => {
    const bind = element.props.bind as string;
    const value = bind ? (state[bind] as number) ?? 0 : 0;
    const rawMin = element.props.min;
    const rawMax = element.props.max;
    const rawStep = element.props.step;
    const min = typeof rawMin === "string" ? parseFloat(rawMin) || 0 : (rawMin as number) ?? 0;
    const max = typeof rawMax === "string" ? parseFloat(rawMax) || 100 : (rawMax as number) ?? 100;
    const step = typeof rawStep === "string" ? parseFloat(rawStep) || 1 : (rawStep as number) ?? 1;
    return (
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => bind && setState(bind, parseFloat(e.target.value))}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
          "[&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
        )}
      />
    );
  },

  Alert: ({ element }: RenderContext) => {
    const variant = (element.props.variant as string) || "default";
    const title = element.props.title as string | undefined;
    const message = element.props.message as string;
    return (
      <div
        className={cn(
          "rounded-lg border p-4",
          alertVariants[variant] || alertVariants.default
        )}
      >
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <p className="text-sm opacity-90">{message}</p>
      </div>
    );
  },

  Avatar: ({ element }: RenderContext) => {
    const src = element.props.src as string | undefined;
    const fallback = element.props.fallback as string;
    const size = (element.props.size as string) || "md";
    return (
      <div
        className={cn(
          "relative rounded-full bg-gray-200 flex items-center justify-center overflow-hidden",
          avatarSizes[size] || avatarSizes.md
        )}
      >
        {src ? (
          <img src={src} alt={fallback} className="h-full w-full object-cover" />
        ) : (
          <span className="font-medium text-gray-600 uppercase">{fallback}</span>
        )}
      </div>
    );
  },

  Image: ({ element }: RenderContext) => {
    const src = element.props.src as string;
    const alt = (element.props.alt as string) || "";
    const rawWidth = element.props.width;
    const rawHeight = element.props.height;
    const width = rawWidth ? (typeof rawWidth === "string" ? parseFloat(rawWidth) || undefined : rawWidth as number) : undefined;
    const height = rawHeight ? (typeof rawHeight === "string" ? parseFloat(rawHeight) || undefined : rawHeight as number) : undefined;
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-md max-w-full h-auto"
      />
    );
  },

  Link: ({ element }: RenderContext) => {
    const text = element.props.text as string;
    const href = element.props.href as string;
    const variant = (element.props.variant as string) || "default";
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "underline underline-offset-2 hover:no-underline transition-colors",
          variant === "muted" ? "text-gray-500 hover:text-gray-700" : "text-gray-900 hover:text-gray-600"
        )}
      >
        {text}
      </a>
    );
  },

  Spacer: ({ element }: RenderContext) => {
    const size = (element.props.size as string) || "md";
    return <div className={spacerSizes[size] || spacerSizes.md} />;
  },
};
