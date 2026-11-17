/**
 * Runtime adapters for the languages that run as source (JavaScript, TypeScript, Python).
 *
 * Test cases are plain JSON: a linked list is [1,2,3], a tree is level order with nulls, a design
 * problem is [operations, argumentLists]. User code works with real ListNode / TreeNode objects and
 * class instances. An adapter bridges the two: it is source text placed before and after the user's
 * code, and it defines `__lfb_entry(...jsonArgs) -> jsonResult`.
 *
 * The same adapter runs in the browser workers and in the CI verifier, so both judge the same way.
 * Pure module (string generation only).
 */
import { parseType, isClass, entryName, methodName, usesStruct } from './codegen.js';

/** True when plain JSON in and out is enough and no adapter is needed. */
export function needsAdapter(sig) {
  return isClass(sig) || usesStruct(sig, 'ListNode') || usesStruct(sig, 'TreeNode');
}

/* ---------- JavaScript / TypeScript ---------- */

const JS_PRELUDE = `function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }
function TreeNode(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; }
`;

const TS_PRELUDE = `class ListNode { val: number; next: ListNode | null; constructor(val?: number, next?: ListNode | null) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; } }
class TreeNode { val: number; left: TreeNode | null; right: TreeNode | null; constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; } }
`;

// Conversions between JSON and nodes. Output walks are capped so a cyclic structure returned by
// user code becomes a clear error instead of an infinite loop.
const jsConvert = (A) => `const __lfb_cap = 1000000;
function __lfb_toList(a${A}) { let h = null; for (let i = a.length - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
function __lfb_fromList(n${A}) { const out = []; while (n) { if (out.length > __lfb_cap) throw new Error('Returned list has a cycle'); out.push(n.val); n = n.next; } return out; }
function __lfb_toTree(a${A}) {
  if (!a.length || a[0] === null) return null;
  const root = new TreeNode(a[0]); const q = [root]; let i = 1;
  for (let h = 0; h < q.length && i < a.length; h++) {
    const node = q[h];
    if (i < a.length && a[i] !== null) { node.left = new TreeNode(a[i]); q.push(node.left); } i++;
    if (i < a.length && a[i] !== null) { node.right = new TreeNode(a[i]); q.push(node.right); } i++;
  }
  return root;
}
function __lfb_fromTree(root${A}) {
  if (!root) return [];
  const out = []; const q = [root];
  for (let h = 0; h < q.length; h++) {
    if (q.length > __lfb_cap) throw new Error('Returned tree has a cycle');
    const node = q[h];
    if (node === null) { out.push(null); continue; }
    out.push(node.val); q.push(node.left || null, node.right || null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}
`;

function jsIn(type, expr) {
  if (type === 'void') return expr;
  const { base, dims } = parseType(type);
  if (base === 'ListNode') return dims ? `${expr}.map(__lfb_toList)` : `__lfb_toList(${expr})`;
  if (base === 'TreeNode') return `__lfb_toTree(${expr})`;
  return expr;
}
function jsOut(type, expr) {
  if (type === 'void') return 'null';
  const { base, dims } = parseType(type);
  if (base === 'ListNode') return dims ? `(${expr}).map(__lfb_fromList)` : `__lfb_fromList(${expr})`;
  if (base === 'TreeNode') return `__lfb_fromTree(${expr})`;
  return `(${expr} === undefined ? null : ${expr})`;
}

function jsAdapter(sig, ts) {
  const name = entryName('javascript', sig.name);
  const any = ts ? ': any' : '';
  // TypeScript checks the whole file strictly, so the helpers carry explicit `any` annotations.
  const before = `${ts ? TS_PRELUDE : JS_PRELUDE}${jsConvert(any)}const __lfb_user${any} = (function () {\n`;
  let after = `\nreturn typeof ${name} === 'function' ? ${name} : undefined;\n})();\n`;
  const missing = `throw new Error('${isClass(sig) ? 'Class' : 'Function'} "${name}" was not found. Keep the starter signature.')`;
  if (isClass(sig)) {
    const cases = sig.methods
      .map((m) => `      case '${m.name}': { const r = obj.${m.name}(${m.params.map((p, j) => jsIn(p.type, `a[${j}]`)).join(', ')}); out.push(${jsOut(m.returns, 'r')}); break; }`)
      .join('\n');
    after += `function __lfb_entry(ops${any}, args${any}) {
  if (!__lfb_user) ${missing};
  const out${any} = []; let obj${any} = null;
  for (let i = 0; i < ops.length; i++) {
    const a = args[i] || [];
    if (i === 0) { obj = new __lfb_user(${sig.constructor.params.map((p, j) => jsIn(p.type, `a[${j}]`)).join(', ')}); out.push(null); continue; }
    switch (ops[i]) {
${cases}
      default: throw new Error('Unknown operation ' + ops[i]);
    }
  }
  return out;
}
`;
  } else {
    after += `function __lfb_entry(...args${any}) {
  if (!__lfb_user) ${missing};
  const r = __lfb_user(${sig.params.map((p, i) => jsIn(p.type, `args[${i}]`)).join(', ')});
  return ${jsOut(sig.returns, 'r')};
}
`;
  }
  return { before, after, entry: '__lfb_entry' };
}

/* ---------- Python ---------- */

const PY_PRELUDE = `from typing import Optional, List

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
`;

const PY_CONVERT = `
__lfb_cap = 1000000

def __lfb_to_list(a):
    head = None
    for v in reversed(a):
        head = ListNode(v, head)
    return head

def __lfb_from_list(node):
    out = []
    while node is not None:
        if len(out) > __lfb_cap:
            raise ValueError("Returned list has a cycle")
        out.append(node.val)
        node = node.next
    return out

def __lfb_to_tree(a):
    if not a or a[0] is None:
        return None
    root = TreeNode(a[0])
    q = [root]
    i = 1
    h = 0
    while h < len(q) and i < len(a):
        node = q[h]
        h += 1
        if i < len(a) and a[i] is not None:
            node.left = TreeNode(a[i])
            q.append(node.left)
        i += 1
        if i < len(a) and a[i] is not None:
            node.right = TreeNode(a[i])
            q.append(node.right)
        i += 1
    return root

def __lfb_from_tree(root):
    if root is None:
        return []
    out = []
    q = [root]
    h = 0
    while h < len(q):
        if len(q) > __lfb_cap:
            raise ValueError("Returned tree has a cycle")
        node = q[h]
        h += 1
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        q.append(node.left)
        q.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out
`;

function pyIn(type, expr) {
  const { base, dims } = parseType(type);
  if (base === 'ListNode') return dims ? `[__lfb_to_list(x) for x in ${expr}]` : `__lfb_to_list(${expr})`;
  if (base === 'TreeNode') return `__lfb_to_tree(${expr})`;
  return expr;
}
function pyOut(type, expr) {
  if (type === 'void') return 'None';
  const { base, dims } = parseType(type);
  if (base === 'ListNode') return dims ? `[__lfb_from_list(x) for x in ${expr}]` : `__lfb_from_list(${expr})`;
  if (base === 'TreeNode') return `__lfb_from_tree(${expr})`;
  return expr;
}

function pyAdapter(sig) {
  const name = entryName('python', sig.name);
  const missing = `raise NameError('${isClass(sig) ? 'Class' : 'Function'} "${name}" was not found. Keep the starter signature.')`;
  let after;
  if (isClass(sig)) {
    const branches = sig.methods
      .map((m, k) => `        ${k ? 'elif' : 'if'} op == ${JSON.stringify(m.name)}:\n            r = obj.${methodName('python', sig.name, m.name)}(${m.params.map((p, j) => pyIn(p.type, `a[${j}]`)).join(', ')})\n            out.append(${pyOut(m.returns, 'r')})`)
      .join('\n');
    after = `
def __lfb_entry(ops, args):
    if ${JSON.stringify(name)} not in globals():
        ${missing}
    cls = globals()[${JSON.stringify(name)}]
    out = []
    obj = None
    for i, op in enumerate(ops):
        a = args[i] if i < len(args) else []
        if i == 0:
            obj = cls(${sig.constructor.params.map((p, j) => pyIn(p.type, `a[${j}]`)).join(', ')})
            out.append(None)
            continue
${branches}
        else:
            raise ValueError("Unknown operation " + op)
    return out
`;
  } else {
    after = `
def __lfb_entry(*args):
    if ${JSON.stringify(name)} not in globals():
        ${missing}
    r = globals()[${JSON.stringify(name)}](${sig.params.map((p, i) => pyIn(p.type, `args[${i}]`)).join(', ')})
    return ${pyOut(sig.returns, 'r')}
`;
  }
  return { before: PY_PRELUDE + PY_CONVERT, after, entry: '__lfb_entry' };
}

/**
 * Adapter source for a language, or null when the signature needs none (plain JSON in and out).
 * @param {'javascript'|'typescript'|'python'} lang
 * @param {object} sig
 * @returns {{ before: string, after: string, entry: string } | null}
 */
export function adapterFor(lang, sig) {
  if (!needsAdapter(sig)) return null;
  if (lang === 'javascript') return jsAdapter(sig, false);
  if (lang === 'typescript') return jsAdapter(sig, true);
  if (lang === 'python') return pyAdapter(sig);
  throw new Error(`No source adapter for ${lang}`);
}
