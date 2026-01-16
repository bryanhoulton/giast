import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  type GaistProgram,
  GaistRenderer,
} from 'gaist-react';
import { Link } from 'react-router-dom';

import { catalog } from './catalog';
import { components } from './components';

// Code block component for syntax highlighting
function CodeBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#eee] rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[#fafafa] border-b border-[#eee]">
        <span className="text-xs text-[#999] font-mono">{title}</span>
      </div>
      <div className="p-4 bg-[#1a1a1a] overflow-x-auto">
        <pre className="text-sm font-mono text-[#e6e6e6] leading-relaxed">
          {children}
        </pre>
      </div>
    </div>
  );
}

// Syntax highlighting helpers
function Keyword({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ff7b72]">{children}</span>;
}
function Str({ children }: { children: React.ReactNode }) {
  return <span className="text-[#a5d6ff]">{children}</span>;
}
function Func({ children }: { children: React.ReactNode }) {
  return <span className="text-[#d2a8ff]">{children}</span>;
}
function Comment({ children }: { children: React.ReactNode }) {
  return <span className="text-[#8b949e]">{children}</span>;
}
function Prop({ children }: { children: React.ReactNode }) {
  return <span className="text-[#79c0ff]">{children}</span>;
}

// Format toggle for code examples
function FormatToggle({
  format,
  onToggle,
}: {
  format: "gaist" | "json";
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-[#2d2d2d] rounded px-1 py-0.5">
      <button
        onClick={onToggle}
        className={`text-xs px-2 py-0.5 rounded transition-colors ${
          format === "gaist"
            ? "bg-[#404040] text-white"
            : "text-[#999] hover:text-white"
        }`}
      >
        .gaist
      </button>
      <button
        onClick={onToggle}
        className={`text-xs px-2 py-0.5 rounded transition-colors ${
          format === "json"
            ? "bg-[#404040] text-white"
            : "text-[#999] hover:text-white"
        }`}
      >
        .json
      </button>
    </div>
  );
}

// Code block with format toggle
function CodeBlockWithToggle({
  title,
  gaistContent,
  jsonContent,
}: {
  title: string;
  gaistContent: React.ReactNode;
  jsonContent: React.ReactNode;
}) {
  const [format, setFormat] = useState<"gaist" | "json">("gaist");

  return (
    <div className="border border-[#eee] rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[#fafafa] border-b border-[#eee] flex items-center justify-between">
        <span className="text-xs text-[#999] font-mono">
          {title}.{format}
        </span>
        <FormatToggle format={format} onToggle={() => setFormat(format === "gaist" ? "json" : "gaist")} />
      </div>
      <div className="p-4 bg-[#1a1a1a] overflow-x-auto">
        <pre className="text-sm font-mono text-[#e6e6e6] leading-relaxed">
          {format === "gaist" ? gaistContent : jsonContent}
        </pre>
      </div>
    </div>
  );
}

// Counter program for intro demo
const COUNTER_PROGRAM: GaistProgram = {
  state: [{ name: "count", init: 0 }],
  logic: [
    {
      name: "increment",
      body: [
        {
          kind: "assign",
          target: "count",
          expr: {
            kind: "binary",
            op: "+",
            left: { kind: "var", name: "count" },
            right: { kind: "literal", value: 1 },
          },
        },
      ],
    },
    {
      name: "decrement",
      body: [
        {
          kind: "assign",
          target: "count",
          expr: {
            kind: "binary",
            op: "-",
            left: { kind: "var", name: "count" },
            right: { kind: "literal", value: 1 },
          },
        },
      ],
    },
    {
      name: "reset",
      body: [
        {
          kind: "assign",
          target: "count",
          expr: { kind: "literal", value: 0 },
        },
      ],
    },
  ],
  ui: {
    type: "Card",
    props: { title: "Counter" },
    children: [
      {
        type: "Column",
        props: { gap: "md" },
        children: [
          {
            type: "Text",
            props: { content: "Count: {{count}}", variant: "heading" },
          },
          {
            type: "Row",
            props: { gap: "sm" },
            children: [
              {
                type: "Button",
                props: { label: "−", variant: "outline" },
                onClick: { func: "decrement" },
              },
              {
                type: "Button",
                props: { label: "+", variant: "outline" },
                onClick: { func: "increment" },
              },
              {
                type: "Button",
                props: { label: "Reset", variant: "ghost" },
                onClick: { func: "reset" },
              },
            ],
          },
        ],
      },
    ],
  },
};

// Toggle program for logic demo
const TOGGLE_PROGRAM: GaistProgram = {
  state: [
    { name: "isOn", init: false },
    { name: "label", init: "Off" },
  ],
  logic: [
    {
      name: "toggle",
      body: [
        {
          kind: "if",
          cond: { kind: "var", name: "isOn" },
          then: [
            {
              kind: "assign",
              target: "isOn",
              expr: { kind: "literal", value: false },
            },
            {
              kind: "assign",
              target: "label",
              expr: { kind: "literal", value: "Off" },
            },
          ],
          else: [
            {
              kind: "assign",
              target: "isOn",
              expr: { kind: "literal", value: true },
            },
            {
              kind: "assign",
              target: "label",
              expr: { kind: "literal", value: "On" },
            },
          ],
        },
      ],
    },
  ],
  ui: {
    type: "Row",
    props: { gap: "md", align: "center" },
    children: [
      {
        type: "Text",
        props: { content: "Status: {{label}}", variant: "default" },
      },
      {
        type: "Button",
        props: { label: "Toggle", variant: "secondary" },
        onClick: { func: "toggle" },
      },
    ],
  },
};

// Visual: State management flow
export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-6 leading-tight">
              Expressive UIs from
              <br />
              constrained syntax trees
            </h1>
            <p className="text-lg text-[#666] mb-4">
              Gaist is a language for stateful UIs. You can write in a readable
              syntax or generate JSON directly. Either way, it compiles to the
              same AST that renders interactive components.
            </p>
            <p className="text-lg text-[#666] mb-8">
              We built the tokenizer, parser, and runtime. You get state
              management, event handlers, and conditionals, all in a format
              that's safe for LLMs to generate.
            </p>

            <Link
              to="/demo"
              className="inline-block px-8 py-4 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#333] transition-colors text-lg"
            >
              Try the Demo
            </Link>
          </motion.div>
        </section>

        {/* Show Both Formats */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Two ways to write, one AST
            </h2>

            <p className="text-lg text-[#666] mb-8">
              <code className="text-sm bg-[#f6f8fa] px-1 rounded">.gaist</code>{" "}
              is readable and writable by hand. JSON is what LLMs output and
              what the runtime executes. Both represent the same program.
            </p>

            <div className="space-y-4">
              <CodeBlockWithToggle
                title="counter"
                gaistContent={
                  <>
                    <Keyword>state</Keyword> {"{\n"}
                    {"  "}count = <span className="text-[#79c0ff]">0</span>;{"\n"}
                    {"}\n\n"}
                    <Keyword>logic</Keyword> {"{\n"}
                    {"  "}
                    <Keyword>function</Keyword> <Func>increment</Func>() {"{\n"}
                    {"    "}count = count + <span className="text-[#79c0ff]">1</span>;{"\n"}
                    {"  }\n"}
                    {"  "}
                    <Keyword>function</Keyword> <Func>decrement</Func>() {"{\n"}
                    {"    "}count = count - <span className="text-[#79c0ff]">1</span>;{"\n"}
                    {"  }\n"}
                    {"}\n\n"}
                    <Keyword>ui</Keyword> {"{\n"}
                    {"  "}
                    <Func>Card</Func> {"{\n"}
                    {"    "}
                    <Func>Text</Func>(content: <Str>"Count: {"{{count}}"}"</Str>){"\n"}
                    {"    "}
                    <Func>Row</Func> {"{\n"}
                    {"      "}
                    <Func>Button</Func>(label: <Str>"−"</Str>) {"{"} onClick: decrement {"}\n"}
                    {"      "}
                    <Func>Button</Func>(label: <Str>"+"</Str>) {"{"} onClick: increment {"}\n"}
                    {"    }\n"}
                    {"  }\n"}
                    {"}"}
                  </>
                }
                jsonContent={
                  <>
                    {"{"}
                    {"\n"}
                    {"  "}
                    <Prop>"state"</Prop>: [{"{ "}
                    <Prop>"name"</Prop>: <Str>"count"</Str>, <Prop>"init"</Prop>:{" "}
                    <span className="text-[#79c0ff]">0</span>
                    {" }"}],{"\n"}
                    {"  "}
                    <Prop>"logic"</Prop>: [{"{ "}
                    <Prop>"name"</Prop>: <Str>"increment"</Str>, <Prop>"body"</Prop>: [...]
                    {" }"}, {"{ "}
                    <Prop>"name"</Prop>: <Str>"decrement"</Str>, ...{" }"}],{"\n"}
                    {"  "}
                    <Prop>"ui"</Prop>: {"{\n"}
                    {"    "}
                    <Prop>"type"</Prop>: <Str>"Card"</Str>,{"\n"}
                    {"    "}
                    <Prop>"children"</Prop>: [{"\n"}
                    {"      "}
                    {"{ "}
                    <Prop>"type"</Prop>: <Str>"Text"</Str>, <Prop>"props"</Prop>:{" "}
                    {"{ "}
                    <Prop>"content"</Prop>: <Str>"Count: {"{{count}}"}"</Str>
                    {" } }"},
                    {"\n"}
                    {"      "}
                    {"{ "}
                    <Prop>"type"</Prop>: <Str>"Row"</Str>, <Prop>"children"</Prop>: [{"\n"}
                    {"        "}
                    {"{ "}
                    <Prop>"type"</Prop>: <Str>"Button"</Str>, <Prop>"props"</Prop>:{" "}
                    {"{ "}
                    <Prop>"label"</Prop>: <Str>"−"</Str>
                    {" }"}, <Prop>"onClick"</Prop>: {"{ "}
                    <Prop>"func"</Prop>: <Str>"decrement"</Str>
                    {" } }"},
                    {"\n"}
                    {"        "}
                    {"{ "}
                    <Prop>"type"</Prop>: <Str>"Button"</Str>, <Prop>"props"</Prop>:{" "}
                    {"{ "}
                    <Prop>"label"</Prop>: <Str>"+"</Str>
                    {" }"}, <Prop>"onClick"</Prop>: {"{ "}
                    <Prop>"func"</Prop>: <Str>"increment"</Str>
                    {" } }"}
                    {"\n"}
                    {"      "}] {"}"}
                    {"\n"}
                    {"    "}]{"\n"}
                    {"  "}
                    {"}"}
                    {"\n"}
                    {"}"}
                  </>
                }
              />

              {/* Live Demo */}
              <div className="border border-[#eee] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[#fafafa] border-b border-[#eee] flex items-center justify-between">
                  <span className="text-xs text-[#999] font-mono">
                    rendered output
                  </span>
                  <span className="text-xs text-[#999]">
                    interactive — try it
                  </span>
                </div>
                <div className="p-6 bg-white">
                  <GaistRenderer
                    catalog={catalog}
                    components={components}
                    program={COUNTER_PROGRAM}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 1: Constrained Design */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Constrained by design
            </h2>

            <p className="text-lg text-[#666] mb-4">
              You register a catalog of components: your design system, your
              props, your rules. The LLM can only reference what you've
              defined. No hallucinated imports, no invented components.
            </p>

            <p className="text-lg text-[#666] mb-4">
              Each component declares its allowed props, types, and children.
              Output is validated against your schema, so undefined references
              fail fast.
            </p>

            <p className="text-lg text-[#666] mb-8">
              This isn't about limiting creativity. It's about reliable
              generation. Bounded output space means fewer hallucinations and
              more consistent results.
            </p>

            <div className="space-y-4">
              <CodeBlock title="catalog.ts">
                <Keyword>import</Keyword> {"{ createCatalog }"}{" "}
                <Keyword>from</Keyword> <Str>"gaist-react"</Str>;{"\n"}
                <Keyword>import</Keyword> {"{ z }"} <Keyword>from</Keyword>{" "}
                <Str>"zod"</Str>;{"\n\n"}
                <Keyword>export const</Keyword> catalog ={" "}
                <Func>createCatalog</Func>({"{\n"}
                {"  "}components: {"{\n"}
                {"    "}Button: {"{\n"}
                {"      "}props: z.<Func>object</Func>({"{\n"}
                {"        "}label: z.<Func>string</Func>(),{"\n"}
                {"        "}variant: z.<Func>enum</Func>([
                <Str>"primary"</Str>, <Str>"secondary"</Str>]),{"\n"}
                {"      "}
                {"}"}),{"\n"}
                {"      "}action: <Prop>true</Prop>,{" "}
                <Comment>// can trigger onClick</Comment>
                {"\n"}
                {"    "}
                {"}"},{"\n"}
                {"    "}Card: {"{\n"}
                {"      "}props: z.<Func>object</Func>({"{ "}title: z.
                <Func>string</Func>().<Func>optional</Func>() {"}"}),{"\n"}
                {"      "}children: <Prop>true</Prop>,{" "}
                <Comment>// can have nested components</Comment>
                {"\n"}
                {"    "}
                {"}"},{"\n"}
                {"  "}
                {"}"},{"\n"}
                {"}"});
              </CodeBlock>

              <CodeBlock title="components.tsx">
                <Keyword>export const</Keyword> components = {"{\n"}
                {"  "}
                <Func>Button</Func>: {"({ "}element, onAction{"}) => (\n"}
                {"    "}
                {"<"}button{"\n"}
                {"      "}onClick={"{"}onAction{"}\n"}
                {"      "}className={"{"}
                <Func>getButtonStyles</Func>(element.props.variant){"}\n"}
                {"    "}
                {">\n"}
                {"      "}{"{"}element.props.label{"}\n"}
                {"    "}
                {"<"}/button{">\n"}
                {"  "}),{"\n\n"}
                {"  "}
                <Func>Card</Func>: {"({ "}element, children{"}) => (\n"}
                {"    "}
                {"<"}div className=<Str>"card"</Str>{">\n"}
                {"      "}{"{"}element.props.title && {"<"}h3{">{"}
                element.props.title{"}<"}/h3{">}}\n"}
                {"      "}{"{"}children{"}\n"}
                {"    "}
                {"<"}/div{">\n"}
                {"  "}),{"\n"}
                {"}"};
              </CodeBlock>
            </div>
          </motion.div>
        </section>

        {/* Section 2: Stateful UIs */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Real state management
            </h2>

            <p className="text-lg text-[#666] mb-4">
              Most LLM UI tools generate static HTML. Gaist generates{" "}
              <em>stateful</em> UIs. You declare variables, bind them to
              components, and define how events update state. All in one format.
            </p>

            <p className="text-lg text-[#666] mb-4">
              The runtime works like a reducer: events trigger functions,
              functions update state, the UI re-renders. No manual wiring, no
              hooks to write. The AST describes the behavior and Gaist executes
              it.
            </p>

            <p className="text-lg text-[#666]">
              This is what makes it useful for LLMs. They can generate counters,
              forms with validation, multi-step wizards. Anything that needs
              state. Real interactivity, not just markup.
            </p>
          </motion.div>
        </section>

        {/* Section 3: Logic and Expressions */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Logic built in
            </h2>

            <p className="text-lg text-[#666] mb-4">
              Tools like{" "}
              <a
                href="https://json-render.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a1a1a] underline underline-offset-2 hover:text-[#666]"
              >
                json-render
              </a>{" "}
              pioneered guardrailed UI generation with component catalogs.
              Gaist builds on this with a key addition: an expression AST and
              logic functions that let LLMs define behavior, not just layout.
            </p>

            <p className="text-lg text-[#666] mb-8">
              Expressions are structured nodes (arithmetic, comparisons,
              variable references) that the runtime evaluates safely. Logic
              functions can branch with conditionals, update state, and call
              other functions. It's all just JSON.
            </p>

            <div className="space-y-4">
              <CodeBlockWithToggle
                title="toggle"
                gaistContent={
                  <>
                    <Keyword>state</Keyword> {"{\n"}
                    {"  "}isOn = <Keyword>false</Keyword>;{"\n"}
                    {"  "}label = <Str>"Off"</Str>;{"\n"}
                    {"}\n\n"}
                    <Keyword>logic</Keyword> {"{\n"}
                    {"  "}
                    <Keyword>function</Keyword> <Func>toggle</Func>() {"{\n"}
                    {"    "}
                    <Keyword>if</Keyword> (isOn) {"{\n"}
                    {"      "}isOn = <Keyword>false</Keyword>;{"\n"}
                    {"      "}label = <Str>"Off"</Str>;{"\n"}
                    {"    }"} <Keyword>else</Keyword> {"{\n"}
                    {"      "}isOn = <Keyword>true</Keyword>;{"\n"}
                    {"      "}label = <Str>"On"</Str>;{"\n"}
                    {"    }\n"}
                    {"  }\n"}
                    {"}\n\n"}
                    <Keyword>ui</Keyword> {"{\n"}
                    {"  "}
                    <Func>Row</Func> {"{\n"}
                    {"    "}
                    <Func>Text</Func>(content: <Str>"Status: {"{{label}}"}"</Str>){"\n"}
                    {"    "}
                    <Func>Button</Func>(label: <Str>"Toggle"</Str>) {"{"} onClick: toggle {"}\n"}
                    {"  }\n"}
                    {"}"}
                  </>
                }
                jsonContent={
                  <>
                    {"{"}
                    {"\n"}
                    {"  "}
                    <Prop>"state"</Prop>: [{"\n"}
                    {"    "}
                    {"{ "}
                    <Prop>"name"</Prop>: <Str>"isOn"</Str>, <Prop>"init"</Prop>:{" "}
                    <Keyword>false</Keyword>
                    {" }"},
                    {"\n"}
                    {"    "}
                    {"{ "}
                    <Prop>"name"</Prop>: <Str>"label"</Str>, <Prop>"init"</Prop>:{" "}
                    <Str>"Off"</Str>
                    {" }"}
                    {"\n"}
                    {"  "}],{"\n"}
                    {"  "}
                    <Prop>"logic"</Prop>: [{"{\n"}
                    {"    "}
                    <Prop>"name"</Prop>: <Str>"toggle"</Str>,{"\n"}
                    {"    "}
                    <Prop>"body"</Prop>: [{"{ "}
                    <Prop>"kind"</Prop>: <Str>"if"</Str>, <Prop>"cond"</Prop>: ...,{"\n"}
                    {"      "}
                    <Prop>"then"</Prop>: [{"{ "}
                    <Prop>"kind"</Prop>: <Str>"assign"</Str>, ...{" }"}],{"\n"}
                    {"      "}
                    <Prop>"else"</Prop>: [{"{ "}
                    <Prop>"kind"</Prop>: <Str>"assign"</Str>, ...{" }"}]
                    {" }]"}
                    {"\n"}
                    {"  }]"},
                    {"\n"}
                    {"  "}
                    <Prop>"ui"</Prop>: {"{\n"}
                    {"    "}
                    <Prop>"type"</Prop>: <Str>"Row"</Str>,{"\n"}
                    {"    "}
                    <Prop>"children"</Prop>: [{"\n"}
                    {"      "}
                    {"{ "}
                    <Prop>"type"</Prop>: <Str>"Text"</Str>, <Prop>"props"</Prop>:{" "}
                    {"{ "}
                    <Prop>"content"</Prop>: <Str>"Status: {"{{label}}"}"</Str>
                    {" } }"},
                    {"\n"}
                    {"      "}
                    {"{ "}
                    <Prop>"type"</Prop>: <Str>"Button"</Str>, <Prop>"props"</Prop>:{" "}
                    {"{ "}
                    <Prop>"label"</Prop>: <Str>"Toggle"</Str>
                    {" }"},
                    {"\n"}
                    {"        "}
                    <Prop>"onClick"</Prop>: {"{ "}
                    <Prop>"func"</Prop>: <Str>"toggle"</Str>
                    {" } }"}
                    {"\n"}
                    {"    "}]{"\n"}
                    {"  "}
                    {"}"}
                    {"\n"}
                    {"}"}
                  </>
                }
              />

              {/* Live Toggle Demo */}
              <div className="border border-[#eee] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[#fafafa] border-b border-[#eee] flex items-center justify-between">
                  <span className="text-xs text-[#999] font-mono">
                    rendered output
                  </span>
                  <span className="text-xs text-[#999]">
                    conditional logic in action
                  </span>
                </div>
                <div className="p-6 bg-white">
                  <GaistRenderer
                    catalog={catalog}
                    components={components}
                    program={TOGGLE_PROGRAM}
                  />
                </div>
              </div>
            </div>

            <p className="text-sm text-[#999] mt-4">
              This isn't string-based code. It's a typed AST. No eval, no
              injection risks. The runtime validates everything before
              execution.
            </p>
          </motion.div>
        </section>

        {/* Section 4: Verifiable and Fast */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Verifiable and fast
            </h2>

            <p className="text-lg text-[#666] mb-4">
              Gaist programs are JSON. You can validate them with a schema
              before rendering: check that components exist, props are valid,
              state is declared. Catch errors before users see them.
            </p>

            <p className="text-lg text-[#666] mb-4">
              The expression language is intentionally minimal: arithmetic,
              comparisons, property access. No loops, no closures, no side
              effects. It's fast to parse and safe to evaluate.
            </p>

            <p className="text-lg text-[#666]">
              And because it's structured JSON rather than arbitrary code, you
              can inspect it, transform it, store it, version it. The UI
              becomes data.
            </p>

            <div className="py-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 border border-[#eee] rounded-lg">
                  <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
                    JSON
                  </div>
                  <div className="text-sm text-[#666]">Schema validated</div>
                </div>
                <div className="p-4 border border-[#eee] rounded-lg">
                  <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
                    Safe
                  </div>
                  <div className="text-sm text-[#666]">No eval, no XSS</div>
                </div>
                <div className="p-4 border border-[#eee] rounded-lg">
                  <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
                    Fast
                  </div>
                  <div className="text-sm text-[#666]">Instant rendering</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA - Bottom */}
        <section className="py-16 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
              See it in action
            </h2>
            <p className="text-lg text-[#666] mb-8">
              Describe a UI in plain English. Watch it become a working,
              stateful interface.
            </p>

            <Link
              to="/demo"
              className="inline-block px-8 py-4 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#333] transition-colors"
            >
              Try the Demo
            </Link>

            <div className="flex items-center justify-center gap-6 text-xs text-[#999] mt-8">
              <a
                href="https://github.com/bryanhoulton/gaist"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#666] transition-colors"
              >
                GitHub
              </a>
              <span>•</span>
              <span>MIT License</span>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
