import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { Example } from './Example';

// ============================================================================
// Example DSL Programs
// ============================================================================

const COUNTER_DSL = `state {
  count = 0;
}

logic {
  function increment() {
    count = count + 1;
  }
  function decrement() {
    count = count - 1;
  }
  function reset() {
    count = 0;
  }
}

ui {
  Card(title: "Counter") {
    Column(gap: "md") {
      Text(content: "Count: {{count}}", variant: "heading")
      Row(gap: "sm") {
        Button(label: "−", variant: "outline") { onClick: decrement }
        Button(label: "+", variant: "outline") { onClick: increment }
        Button(label: "Reset", variant: "ghost") { onClick: reset }
      }
    }
  }
}`;

// ============================================================================
// Code Block Components
// ============================================================================

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

// ============================================================================
// Landing Page
// ============================================================================
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
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-8 leading-tight">
              Expressive UIs from LLM
            </h1>

            <p className="text-lg text-[#666] mb-4">
              Generating UIs with LLMs comes with trade-offs. Notably, developers
              must trade expressiveness for constraints. Since LLMs are still
              terrible at consistent design, most applications of generated UIs
              need to be design-constrained.
            </p>

            <p className="text-lg text-[#666] mb-4">
              Packages like{" "}
              <a
                href="https://json-render.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a1a1a] underline underline-offset-2 hover:text-[#666]"
              >
                json-render
              </a>{" "}
              can generate design-constrained UIs with structured output, but
              these frameworks are inherently limited. Any logic or state
              management must still be implemented <i>outside of the generated UI</i>,
              resulting in the UIs being thin wrappers around existing state and
              logic.
            </p>

            <p className="text-lg text-[#1a1a1a] mb-4 font-bold">
              But what if the <i>logic</i> of the UI was generated too?
            </p>

            <p className="text-lg text-[#666] mb-4">
              The only way to do this today would be to have an LLM generate fully expressive
              frontend code directly, which is very unreliable and error prone.
            </p>

            <p className="text-lg text-[#666] mb-4">
              We built Gaist to solve this problem. Gaist is a language for
              stateful, design-constrained UIs. An LLM can write expressive logic
              in tandem with a UI composed of components from a user-defined
              catalog. This program will compile into a design-safe, JSON-representable AST,
              which will be rendered and executed by the built-in Gaist runtime.
            </p>

            <Example dsl={COUNTER_DSL} initialTab="rendered" title="counter" />

            <div className="mt-8">
              <Link
                to="/demo"
                className="inline-block px-8 py-4 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#333] transition-colors text-lg"
              >
                Try the Demo
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Section 1: Constrained by Design */}
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
              props, your rules. The LLM can only compose UIs with the
              components you've defined. Gaist will not compile otherwise,
              preventing hallucinations and undefined references.
            </p>

            <p className="text-lg text-[#666] mb-8">
              You define the allowed props in a catalog of components, and
              you'll make functions for them to render. This is intentionally very similar to the DX of{" "}
              <a
                href="https://json-render.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a1a1a] underline underline-offset-2 hover:text-[#666]"
              >
                json-render
              </a>.
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

        {/* Section 2: Reducer State Management */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Reducer state management
            </h2>

            <p className="text-lg text-[#666] mb-4">
              Having a generated UI backed by an actual executable program is
              what allows Gaist to be so expressive. An LLM can write both the
              program and the UI in one pass, generating an expressive and
              stateful UI.
            </p>

            <p className="text-lg text-[#666] mb-8">
              State management in Gaist is modeled after reducer patterns. State
              is tracked in a global store, though Gaist is capable of much more
              complex scoping.
            </p>

            <CodeBlock title="example.gaist">
              <Comment>// declare reactive state</Comment>{"\n"}
              <Keyword>state</Keyword> {"{\n"}
              {"  "}count = <Prop>0</Prop>;{"\n"}
              {"}\n\n"}
              <Comment>// define actions that modify state</Comment>{"\n"}
              <Keyword>logic</Keyword> {"{\n"}
              {"  "}<Keyword>function</Keyword> <Func>increment</Func>() {"{\n"}
              {"    "}count = count + <Prop>1</Prop>;{"\n"}
              {"  }\n"}
              {"}\n\n"}
              <Comment>// bind state and actions to UI</Comment>{"\n"}
              <Keyword>ui</Keyword> {"{\n"}
              {"  "}Button(label: <Str>"Count: {"{{"}count{"}}"}"</Str>) {"{"} onClick: increment {"}\n"}
              {"}"}
            </CodeBlock>
          </motion.div>
        </section>

        {/* Section 3: Built-in Functions */}
        <section className="py-12 border-t border-[#eee]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
              Built-ins
            </h2>

            <p className="text-lg text-[#666] mb-4">
              Gaist includes built-in functions for common operations, available
              in any expression. It also supports conditional visibility on any
              component.
            </p>

            <h3 className="text-lg font-semibold text-[#1a1a1a] mt-8 mb-4">Functions</h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">randInt(min, max)</code>
                <p className="text-sm text-[#666] mt-1">Random integer in range</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">rand()</code>
                <p className="text-sm text-[#666] mt-1">Random float 0–1</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">min(a, b, ...)</code>
                <p className="text-sm text-[#666] mt-1">Minimum of values</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">max(a, b, ...)</code>
                <p className="text-sm text-[#666] mt-1">Maximum of values</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">abs(n)</code>
                <p className="text-sm text-[#666] mt-1">Absolute value</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">round(n)</code>
                <p className="text-sm text-[#666] mt-1">Round to nearest integer</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">floor(n) / ceil(n)</code>
                <p className="text-sm text-[#666] mt-1">Round down / up</p>
              </div>
              <div className="p-4 border border-[#eee] rounded-lg">
                <code className="text-sm font-mono text-[#1a1a1a]">len(s)</code>
                <p className="text-sm text-[#666] mt-1">Length of string</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#1a1a1a] mt-8 mb-4">Visibility</h3>

            <p className="text-lg text-[#666] mb-6">
              Any component can have a <code className="text-sm bg-[#f6f8fa] px-1.5 py-0.5 rounded">visible</code> prop
              that accepts an expression. When the expression evaluates to false,
              the component is not rendered.
            </p>

            <CodeBlock title="conditional visibility">
              <Keyword>state</Keyword> {"{\n"}
              {"  "}isLoggedIn = <Prop>false</Prop>;{"\n"}
              {"  "}count = <Prop>0</Prop>;{"\n"}
              {"}\n\n"}
              <Keyword>ui</Keyword> {"{\n"}
              {"  "}<Comment>// only show when logged in</Comment>{"\n"}
              {"  "}Button(label: <Str>"Logout"</Str>, visible: isLoggedIn){"\n\n"}
              {"  "}<Comment>// show when count {">"} 0</Comment>{"\n"}
              {"  "}Text(content: <Str>"Count: {"{{"}count{"}}"}"</Str>, visible: count {">"} <Prop>0</Prop>){"\n"}
              {"}"}
            </CodeBlock>
          </motion.div>
        </section>

        {/* CTA - See it in action */}
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

            <div className="flex items-center justify-center gap-6 text-sm text-[#999] mt-8">
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
