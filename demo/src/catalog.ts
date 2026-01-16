import { createCatalog } from "gaist-react";
import { z } from "zod";

// Helper for props that can be either a literal value or an interpolated string like "{{varName}}"
const numOrInterpolated = z.union([z.number(), z.string()]);

export const catalog = createCatalog({
  components: {
    Card: {
      props: z.object({
        title: z.string().optional(),
      }),
      children: true,
      description: "A container with border, padding, and subtle shadow",
    },
    Column: {
      props: z.object({
        gap: z.enum(["none", "sm", "md", "lg"]).optional(),
      }),
      children: true,
      description: "Vertical flex container",
    },
    Row: {
      props: z.object({
        gap: z.enum(["none", "sm", "md", "lg"]).optional(),
        align: z.enum(["start", "center", "end"]).optional(),
      }),
      children: true,
      description: "Horizontal flex container",
    },
    Text: {
      props: z.object({
        content: z.string(),
        variant: z.enum(["default", "muted", "heading", "label"]).optional(),
      }),
      description:
        "Display text. Use {{varName}} to interpolate state variables.",
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z
          .enum(["default", "secondary", "outline", "ghost", "destructive"])
          .optional(),
        size: z.enum(["default", "sm", "lg"]).optional(),
      }),
      action: true,
      description: "Clickable button that triggers an action",
    },
    Input: {
      props: z.object({
        placeholder: z.string().optional(),
        bind: z.string(),
        type: z.enum(["text", "password", "email", "tel", "number", "url"]).optional(),
      }),
      action: true,
      description:
        "Text input. 'bind' is the state variable name to sync with. 'type' can be text, password, email, tel, number, or url. Action fires on Enter.",
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z
          .enum([
            "default",
            "secondary",
            "outline",
            "success",
            "warning",
            "destructive",
          ])
          .optional(),
      }),
      description: "Small status indicator",
    },
    Divider: {
      props: z.object({}),
      description: "Horizontal line separator",
    },
    Checkbox: {
      props: z.object({
        label: z.string().optional(),
        bind: z.string(),
      }),
      description: "Checkbox input. 'bind' is the boolean state variable to sync with.",
    },
    Switch: {
      props: z.object({
        label: z.string().optional(),
        bind: z.string(),
      }),
      description: "Toggle switch. 'bind' is the boolean state variable to sync with.",
    },
    Select: {
      props: z.object({
        placeholder: z.string().optional(),
        bind: z.string(),
        options: z.string(), // comma-separated options like "apple,banana,cherry"
      }),
      description: "Dropdown select. 'bind' is the state variable, 'options' is comma-separated values.",
    },
    Textarea: {
      props: z.object({
        placeholder: z.string().optional(),
        bind: z.string(),
        rows: numOrInterpolated.optional(),
      }),
      action: true,
      description: "Multi-line text input. 'bind' is the state variable. Action fires on Cmd+Enter.",
    },
    Progress: {
      props: z.object({
        value: numOrInterpolated,
        max: numOrInterpolated.optional(),
      }),
      description: "Progress bar. 'value' is current progress (can use {{varName}} for dynamic values), 'max' defaults to 100.",
    },
    Slider: {
      props: z.object({
        bind: z.string(),
        min: numOrInterpolated.optional(),
        max: numOrInterpolated.optional(),
        step: numOrInterpolated.optional(),
      }),
      description: "Range slider input. 'bind' is the numeric state variable.",
    },
    Alert: {
      props: z.object({
        title: z.string().optional(),
        message: z.string(),
        variant: z.enum(["default", "success", "warning", "error", "info"]).optional(),
      }),
      description: "Alert message box with optional title.",
    },
    Avatar: {
      props: z.object({
        src: z.string().optional(),
        fallback: z.string(),
        size: z.enum(["sm", "md", "lg"]).optional(),
      }),
      description: "User avatar with image or fallback initials.",
    },
    Image: {
      props: z.object({
        src: z.string(),
        alt: z.string().optional(),
        width: numOrInterpolated.optional(),
        height: numOrInterpolated.optional(),
      }),
      description: "Display an image.",
    },
    Link: {
      props: z.object({
        text: z.string(),
        href: z.string(),
        variant: z.enum(["default", "muted"]).optional(),
      }),
      description: "Clickable link that opens in new tab.",
    },
    Spacer: {
      props: z.object({
        size: z.enum(["sm", "md", "lg", "xl"]).optional(),
      }),
      description: "Empty space for layout purposes.",
    },
  },
});
