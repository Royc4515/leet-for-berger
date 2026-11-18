/**
 * TypeScript in the browser: the pure half (no DOM, no Monaco).
 *
 * The user's TypeScript is type-checked and transpiled by the TypeScript service Monaco already
 * runs for the editor (ui/ts-compiler.js), then runs as JavaScript in the JavaScript worker with
 * the JavaScript adapter. Type errors are a Compile Error, as on LeetCode, whose TypeScript
 * environment compiles with the flags below (support.leetcode.com, "What are the environments for
 * the programming languages?"): `--strict false --alwaysStrict --strictBindCallApply
 * --strictFunctionTypes`.
 *
 * The code is checked as a module (a marker is appended, never prepended, so line numbers match the
 * editor). The editor's own model is a global script holding the same declarations; as a module the
 * judged copy shadows them instead of clashing with "Duplicate function implementation".
 */

/**
 * Compiler options for checking and emitting user code. Numbers are TypeScript enum values, which
 * Monaco's `typescriptDefaults.setCompilerOptions` and the `typescript` package both take.
 */
export const TS_COMPILER_OPTIONS = Object.freeze({
  // LeetCode's flags. --strict false means implicit any and loose null checks are allowed.
  strict: false,
  alwaysStrict: true,
  strictBindCallApply: true,
  strictFunctionTypes: true,
  // ES2022 (ts.ScriptTarget.ES2022), as the CI verifier compiles. Monaco's TypeScript 5.4 does not
  // know LeetCode's ES2024 target, and no problem needs anything newer than ES2022.
  target: 9,
  // ESNext modules (ts.ModuleKind.ESNext): the module marker needs a module system, and ESNext
  // emits the marker back as a plain `export {};` line that fromModuleOutput removes.
  module: 99,
});

/**
 * Types the platform provides, declared for the type checker only (the adapter defines them at run
 * time). Mirrors the TypeScript prelude in engine/adapters.js, which CI compiles the solutions with.
 */
export const AMBIENT_TYPES = `declare class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null);
}
declare class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null);
}
declare class RandomListNode {
  val: number;
  next: RandomListNode | null;
  random: RandomListNode | null;
  constructor(val?: number, next?: RandomListNode | null, random?: RandomListNode | null);
}
declare class NestedInteger {
  constructor(v: number | NestedInteger[]);
  isInteger(): boolean;
  getInteger(): number;
  getList(): NestedInteger[];
}
`;

// don't touch / the marker must stay after the code (line numbers) and on its own line (a trailing
// // comment in user code would swallow it).
const MODULE_MARKER = 'export {};';

/**
 * The source that is checked and emitted: the user's code, then the module marker.
 * @param {string} code
 */
export function toModuleSource(code) {
  return `${code}\n${MODULE_MARKER}\n`;
}

/**
 * Emitted JavaScript without the module marker, ready for the JavaScript worker (which runs code
 * through `new Function`, where `export` is a syntax error).
 * @param {string} js emit of toModuleSource(code)
 */
export function fromModuleOutput(js) {
  const at = js.lastIndexOf(`\n${MODULE_MARKER}`);
  if (at === -1 || js.slice(at + MODULE_MARKER.length + 1).trim() !== '') throw new Error('TypeScript output has no module marker at its end.');
  return js.slice(0, at + 1);
}

/**
 * A diagnostic message as tsc prints it: a chain becomes indented lines.
 * @param {string | { messageText: string, next?: object[] }} message
 * @param {number} [depth]
 */
export function flattenMessage(message, depth = 0) {
  if (typeof message === 'string') return message;
  const lines = [`${'  '.repeat(depth)}${message.messageText}`];
  for (const next of message.next ?? []) lines.push(flattenMessage(next, depth + 1));
  return lines.join('\n');
}

/**
 * Errors among TypeScript diagnostics, formatted like LeetCode's Compile Error lines:
 * `Line 3: Char 9: error TS2322: Type 'string' is not assignable to type 'number'.`
 * Warnings and suggestions are dropped: they never block a run.
 * @param {string} source the checked source (toModuleSource(code)); offsets index into it
 * @param {{ start?: number, code: number, category: number, messageText: string | object }[]} diagnostics
 * @returns {string[]}
 */
export function compileErrors(source, diagnostics) {
  const ERROR = 1; // ts.DiagnosticCategory.Error
  return diagnostics
    .filter((d) => d.category === ERROR)
    .map((d) => {
      const text = `error TS${d.code}: ${flattenMessage(d.messageText)}`;
      if (typeof d.start !== 'number') return text;
      const before = source.slice(0, d.start).split('\n');
      return `Line ${before.length}: Char ${before[before.length - 1].length + 1}: ${text}`;
    });
}
