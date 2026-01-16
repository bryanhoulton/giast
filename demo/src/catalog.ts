import { createCatalog } from "gaist-react";
import { z } from "zod";

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
  },
});
