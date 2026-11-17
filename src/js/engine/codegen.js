/**
 * Language-neutral signatures -> per-language names, types and starter code.
 *
 * A problem declares its interface once, with neutral types. Two kinds:
 *
 *   function: { name: 'twoSum', params: [{ name: 'nums', type: 'int[]' }], returns: 'int[]' }
 *   class:    { kind: 'class', name: 'MinStack', constructor: { params: [] },
 *               methods: [{ name: 'push', params: [{ name: 'val', type: 'int' }], returns: 'void' }] }
 *
 * Everything language-specific is derived here, so adding a problem never means writing
 * starter code eight times, and adding a language never means touching every problem.
 *
 * Neutral types: int, long, double, bool, string and arrays of them up to two dimensions
 * (int[], string[][]); ListNode (singly linked list of int, JSON form [1,2,3]), ListNode[];
 * TreeNode (binary tree of int, JSON form level order with nulls [3,9,20,null,null,15,7]).
 * 'void' is allowed only as a class method's return. Pure module: no DOM, safe under node --test.
 */

export const BASE_TYPES = ['int', 'long', 'double', 'bool', 'string'];
export const STRUCT_TYPES = ['ListNode', 'TreeNode'];

/**
 * The eight interview languages. `executable` means it runs in the browser today; the rest are
 * editor-only until the server runner exists (ROADMAP Phase 2).
 */
export const LANGUAGES = [
  { id: 'python', label: 'Python 3', monaco: 'python', file: 'solution.py', executable: true },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', file: 'solution.js', executable: true },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript', file: 'solution.ts', executable: false },
  { id: 'java', label: 'Java 17', monaco: 'java', file: 'Solution.java', executable: false },
  { id: 'cpp', label: 'C++17', monaco: 'cpp', file: 'solution.cpp', executable: false },
  { id: 'c', label: 'C', monaco: 'c', file: 'solution.c', executable: false },
  { id: 'csharp', label: 'C#', monaco: 'csharp', file: 'Solution.cs', executable: false },
  { id: 'go', label: 'Go', monaco: 'go', file: 'solution.go', executable: false },
];

export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);

/** @param {object} sig */
export const isClass = (sig) => sig?.kind === 'class';

/**
 * @param {string} type e.g. 'int[][]', 'ListNode', 'TreeNode'
 * @returns {{ base: string, dims: number, struct: boolean }}
 */
export function parseType(type) {
  const m = /^([A-Za-z]+)((?:\[\])*)$/.exec(type);
  if (!m) throw new Error(`Unknown type "${type}"`);
  const base = m[1];
  const dims = m[2].length / 2;
  const struct = STRUCT_TYPES.includes(base);
  if (!struct && !BASE_TYPES.includes(base)) throw new Error(`Unknown type "${type}"`);
  if (dims > 2) throw new Error(`Type "${type}" has more than 2 dimensions`);
  // Arrays of trees, or 2D arrays of lists, have no interview problem that needs them yet.
  if (base === 'TreeNode' && dims > 0) throw new Error(`Type "${type}" is not supported (only TreeNode)`);
  if (base === 'ListNode' && dims > 1) throw new Error(`Type "${type}" is not supported (ListNode or ListNode[])`);
  return { base, dims, struct };
}

/** Every neutral type a signature mentions, params and returns, across all methods. */
export function typesUsed(sig) {
  const members = isClass(sig) ? [sig.constructor, ...sig.methods] : [sig];
  return members.flatMap((m) => [...m.params.map((p) => p.type), ...(m.returns && m.returns !== 'void' ? [m.returns] : [])]);
}

/** Does the signature use a struct type (so per-language definitions must be provided)? */
export const usesStruct = (sig, base) => typesUsed(sig).some((t) => parseType(t).base === base);

function checkParams(params, where, errors) {
  const names = new Set();
  for (const p of params ?? []) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(p.name)) errors.push(`${where} param ${p.name}: name must be camelCase`);
    if (names.has(p.name)) errors.push(`${where} param ${p.name}: duplicate`);
    names.add(p.name);
    try {
      parseType(p.type);
    } catch (e) {
      errors.push(`${where} param ${p.name}: ${e.message}`);
    }
  }
}

/**
 * Structural check for a signature. Returns errors; empty means valid.
 * @param {object} sig
 */
export function validateSignature(sig) {
  const errors = [];
  if (isClass(sig)) {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(sig.name ?? '')) errors.push('class name must be PascalCase');
    checkParams(sig.constructor?.params, 'constructor', errors);
    if (!Array.isArray(sig.methods) || !sig.methods.length) errors.push('a class needs at least one method');
    const seen = new Set();
    for (const m of sig.methods ?? []) {
      if (!/^[a-z][A-Za-z0-9]*$/.test(m.name)) errors.push(`method ${m.name}: name must be camelCase`);
      if (seen.has(m.name)) errors.push(`method ${m.name}: duplicate`);
      seen.add(m.name);
      checkParams(m.params, `method ${m.name}`, errors);
      if (m.returns !== 'void') {
        try {
          parseType(m.returns ?? '');
        } catch (e) {
          errors.push(`method ${m.name} returns: ${e.message}`);
        }
      }
    }
    return errors;
  }
  if (!/^[a-z][A-Za-z0-9]*$/.test(sig?.name ?? '')) errors.push('name must be camelCase');
  checkParams(sig?.params, '', errors);
  try {
    parseType(sig?.returns ?? '');
  } catch (e) {
    errors.push(`returns: ${e.message}`);
  }
  return errors.map((e) => e.replace(/^ param/, 'param'));
}

const snake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const pascal = (s) => s[0].toUpperCase() + s.slice(1);
const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1);

/**
 * The function name each language expects (Python snake_case, C# PascalCase).
 * For a class signature this is the class name, the same in every language.
 * @param {string} lang
 * @param {string} name camelCase function name or PascalCase class name
 */
export function entryName(lang, name) {
  if (/^[A-Z]/.test(name)) return name;
  if (lang === 'python') return snake(name);
  if (lang === 'csharp') return pascal(name);
  return name;
}

/**
 * A class method's name per language: snake_case in Python, PascalCase in C# and Go
 * (exported), `<class>Method` free functions in C (LeetCode style), camelCase elsewhere.
 * @param {string} lang
 * @param {string} className
 * @param {string} method
 */
export function methodName(lang, className, method) {
  if (lang === 'python') return snake(method);
  if (lang === 'csharp' || lang === 'go') return pascal(method);
  if (lang === 'c') return `${lowerFirst(className)}${pascal(method)}`;
  return method;
}

const SCALAR = {
  python: { int: 'int', long: 'int', double: 'float', bool: 'bool', string: 'str', ListNode: 'Optional[ListNode]', TreeNode: 'Optional[TreeNode]' },
  javascript: { int: 'number', long: 'number', double: 'number', bool: 'boolean', string: 'string', ListNode: 'ListNode', TreeNode: 'TreeNode' },
  typescript: { int: 'number', long: 'number', double: 'number', bool: 'boolean', string: 'string', ListNode: 'ListNode | null', TreeNode: 'TreeNode | null' },
  java: { int: 'int', long: 'long', double: 'double', bool: 'boolean', string: 'String', ListNode: 'ListNode', TreeNode: 'TreeNode' },
  cpp: { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'string', ListNode: 'ListNode*', TreeNode: 'TreeNode*' },
  c: { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'char*', ListNode: 'struct ListNode*', TreeNode: 'struct TreeNode*' },
  csharp: { int: 'int', long: 'long', double: 'double', bool: 'bool', string: 'string', ListNode: 'ListNode', TreeNode: 'TreeNode' },
  go: { int: 'int', long: 'int64', double: 'float64', bool: 'bool', string: 'string', ListNode: '*ListNode', TreeNode: '*TreeNode' },
};

/**
 * A neutral type written in a language (C is handled separately: arrays expand into params).
 * @param {string} lang
 * @param {string} type
 */
export function typeIn(lang, type) {
  if (type === 'void') return { python: 'None', javascript: 'void', typescript: 'void', go: '' }[lang] ?? 'void';
  const { base, dims } = parseType(type);
  let s = SCALAR[lang][base];
  // A list of possibly-empty lists: the element type loses its "| null" / Optional wrapper.
  if (dims > 0 && lang === 'typescript' && base === 'ListNode') s = '(ListNode | null)';
  if (dims > 0 && lang === 'python' && base === 'ListNode') s = 'Optional[ListNode]';
  switch (lang) {
    case 'python':
      return dims === 0 ? s : dims === 1 ? `list[${s}]` : `list[list[${s}]]`;
    case 'cpp':
      return dims === 0 ? s : dims === 1 ? `vector<${s}>` : `vector<vector<${s}>>`;
    case 'go':
      return '[]'.repeat(dims) + s;
    default:
      return s + '[]'.repeat(dims);
  }
}

/** C parameter list for one neutral param, LeetCode-style (arrays carry explicit sizes). */
function cParams(p) {
  const { base, dims } = parseType(p.type);
  const s = SCALAR.c[base];
  if (dims === 0) return [`${s} ${p.name}`];
  if (dims === 1) return [`${s}* ${p.name}`, `int ${p.name}Size`];
  return [`${s}** ${p.name}`, `int ${p.name}Size`, `int* ${p.name}ColSize`];
}

/** C return type and the extra out-params an array return needs. */
function cReturn(type) {
  if (type === 'void') return { ret: 'void', extra: [] };
  const { base, dims } = parseType(type);
  const s = SCALAR.c[base];
  if (dims === 0) return { ret: s, extra: [] };
  if (dims === 1) return { ret: `${s}*`, extra: ['int* returnSize'] };
  return { ret: `${s}**`, extra: ['int* returnSize', 'int** returnColumnSizes'] };
}

/** A value of the type that compiles as a placeholder return. */
function defaultReturn(lang, type) {
  const { base, dims, struct } = parseType(type);
  if (dims === 0 && struct) return { python: 'None', javascript: 'null', typescript: 'null', cpp: 'nullptr', c: 'NULL', go: 'nil' }[lang] ?? 'null';
  if (dims === 0) {
    if (lang === 'java' && base === 'long') return '0L';
    if (lang === 'python') return { int: '0', long: '0', double: '0.0', bool: 'False', string: '""' }[base];
    return { int: '0', long: '0', double: '0.0', bool: 'false', string: '""' }[base];
  }
  switch (lang) {
    case 'python':
      return '[]';
    case 'cpp':
      return '{}';
    case 'go':
      return 'nil';
    case 'c':
      return 'NULL';
    case 'java':
    case 'csharp': {
      const s = SCALAR[lang][base];
      return dims === 1 ? `new ${s}[0]` : `new ${s}[0][]`;
    }
    default:
      return '[]';
  }
}

/** Commented definitions of the struct types a signature uses, shown above the starter code. */
const STRUCT_DOCS = {
  ListNode: {
    python: '# Definition for singly-linked list (provided, do not redefine):\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n',
    javascript: '/**\n * Definition for singly-linked list (provided):\n * function ListNode(val, next) {\n *     this.val = (val === undefined ? 0 : val);\n *     this.next = (next === undefined ? null : next);\n * }\n */\n',
    typescript: '/**\n * Definition for singly-linked list (provided):\n * class ListNode {\n *     val: number\n *     next: ListNode | null\n *     constructor(val?: number, next?: ListNode | null)\n * }\n */\n',
    java: '/**\n * Definition for singly-linked list (provided):\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\n',
    cpp: '/**\n * Definition for singly-linked list (provided):\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\n',
    c: '/**\n * Definition for singly-linked list (provided):\n * struct ListNode {\n *     int val;\n *     struct ListNode *next;\n * };\n */\n',
    csharp: '/**\n * Definition for singly-linked list (provided):\n * public class ListNode {\n *     public int val;\n *     public ListNode next;\n *     public ListNode(int val = 0, ListNode next = null) { this.val = val; this.next = next; }\n * }\n */\n',
    go: '/**\n * Definition for singly-linked list (provided):\n * type ListNode struct {\n *     Val  int\n *     Next *ListNode\n * }\n */\n',
  },
  TreeNode: {
    python: '# Definition for a binary tree node (provided, do not redefine):\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n',
    javascript: '/**\n * Definition for a binary tree node (provided):\n * function TreeNode(val, left, right) {\n *     this.val = (val === undefined ? 0 : val);\n *     this.left = (left === undefined ? null : left);\n *     this.right = (right === undefined ? null : right);\n * }\n */\n',
    typescript: '/**\n * Definition for a binary tree node (provided):\n * class TreeNode {\n *     val: number\n *     left: TreeNode | null\n *     right: TreeNode | null\n *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null)\n * }\n */\n',
    java: '/**\n * Definition for a binary tree node (provided):\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }\n * }\n */\n',
    cpp: '/**\n * Definition for a binary tree node (provided):\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\n',
    c: '/**\n * Definition for a binary tree node (provided):\n * struct TreeNode {\n *     int val;\n *     struct TreeNode *left;\n *     struct TreeNode *right;\n * };\n */\n',
    csharp: '/**\n * Definition for a binary tree node (provided):\n * public class TreeNode {\n *     public int val;\n *     public TreeNode left;\n *     public TreeNode right;\n *     public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null) { this.val = val; this.left = left; this.right = right; }\n * }\n */\n',
    go: '/**\n * Definition for a binary tree node (provided):\n * type TreeNode struct {\n *     Val   int\n *     Left  *TreeNode\n *     Right *TreeNode\n * }\n */\n',
  },
};

function structDocs(lang, sig) {
  return STRUCT_TYPES.filter((t) => usesStruct(sig, t)).map((t) => STRUCT_DOCS[t][lang]).join('');
}

/** Starter code for a class (design) signature. */
function classStarter(lang, sig) {
  const C = sig.name;
  const ctor = sig.constructor.params;
  const pyArgs = (ps) => ps.map((p) => `, ${snake(p.name)}: ${typeIn('python', p.type)}`).join('');
  const typed = (l, ps, sep = ' ') => ps.map((p) => (l === 'go' || l === 'typescript' ? `${p.name}${l === 'typescript' ? ':' : ''} ${typeIn(l, p.type)}` : `${typeIn(l, p.type)}${sep}${p.name}`)).join(', ');
  const ret = (l, m) => (m.returns === 'void' ? '' : `return ${defaultReturn(l, m.returns)};`);
  switch (lang) {
    case 'python':
      return `class ${C}:\n\n    def __init__(self${pyArgs(ctor)}):\n        pass\n${sig.methods.map((m) => `\n    def ${methodName('python', C, m.name)}(self${pyArgs(m.params)}) -> ${typeIn('python', m.returns)}:\n        pass\n`).join('')}`;
    case 'javascript':
      return `class ${C} {\n  constructor(${ctor.map((p) => p.name).join(', ')}) {\n  }\n${sig.methods.map((m) => `\n  /**\n${m.params.map((p) => `   * @param {${typeIn('javascript', p.type)}} ${p.name}\n`).join('')}   * @return {${m.returns === 'void' ? 'void' : typeIn('javascript', m.returns)}}\n   */\n  ${m.name}(${m.params.map((p) => p.name).join(', ')}) {\n  }\n`).join('')}}\n`;
    case 'typescript':
      return `class ${C} {\n  constructor(${typed('typescript', ctor)}) {\n  }\n${sig.methods.map((m) => `\n  ${m.name}(${typed('typescript', m.params)}): ${typeIn('typescript', m.returns)} {\n    ${ret('typescript', m)}\n  }\n`).join('')}}\n`.replace(/\n {4}\n/g, '\n');
    case 'java':
      return `class ${C} {\n\n    public ${C}(${typed('java', ctor)}) {\n    }\n${sig.methods.map((m) => `\n    public ${typeIn('java', m.returns)} ${m.name}(${typed('java', m.params)}) {\n        ${ret('java', m)}\n    }\n`).join('')}}\n`.replace(/\n {8}\n/g, '\n');
    case 'cpp':
      return `class ${C} {\npublic:\n    ${C}(${ctor.map((p) => `${typeIn('cpp', p.type)} ${p.name}`).join(', ')}) {\n    }\n${sig.methods.map((m) => `\n    ${typeIn('cpp', m.returns)} ${m.name}(${m.params.map((p) => (parseType(p.type).dims ? `${typeIn('cpp', p.type)}& ${p.name}` : `${typeIn('cpp', p.type)} ${p.name}`)).join(', ')}) {\n        ${ret('cpp', m)}\n    }\n`).join('')}};\n`.replace(/\n {8}\n/g, '\n');
    case 'c': {
      const fn = (m) => methodName('c', C, m);
      const lines = [`typedef struct {\n    // Your fields here\n} ${C};\n`, `${C}* ${fn('create')}(${ctor.flatMap(cParams).join(', ')}) {\n    ${C}* obj = malloc(sizeof(${C}));\n    return obj;\n}\n`];
      for (const m of sig.methods) {
        const { ret: r, extra } = cReturn(m.returns);
        const body = m.returns === 'void' ? '' : `    ${parseType(m.returns).dims ? '*returnSize = 0;\n    ' : ''}return ${defaultReturn('c', m.returns)};\n`;
        lines.push(`${r} ${fn(m.name)}(${[`${C}* obj`, ...m.params.flatMap(cParams), ...extra].join(', ')}) {\n${body}}\n`);
      }
      lines.push(`void ${fn('free')}(${C}* obj) {\n    free(obj);\n}\n`);
      return lines.join('\n');
    }
    case 'csharp':
      return `public class ${C} {\n\n    public ${C}(${typed('csharp', ctor)}) {\n    }\n${sig.methods.map((m) => `\n    public ${typeIn('csharp', m.returns)} ${methodName('csharp', C, m.name)}(${typed('csharp', m.params)}) {\n        ${ret('csharp', m)}\n    }\n`).join('')}}\n`.replace(/\n {8}\n/g, '\n');
    case 'go':
      return `type ${C} struct {\n}\n\nfunc Constructor(${typed('go', ctor)}) ${C} {\n\treturn ${C}{}\n}\n${sig.methods.map((m) => `\nfunc (this *${C}) ${methodName('go', C, m.name)}(${typed('go', m.params)}) ${m.returns === 'void' ? '' : typeIn('go', m.returns) + ' '}{\n${m.returns === 'void' ? '' : `\treturn ${defaultReturn('go', m.returns)}\n`}}\n`).join('')}`.replace(/\) \{/g, ') {').replace(/\)  \{/g, ') {');
    default:
      throw new Error(`Unknown language "${lang}"`);
  }
}

/**
 * Starter code for one language: struct definitions (as comments), the signature, a placeholder body.
 * @param {string} lang
 * @param {object} sig
 */
export function starterCode(lang, sig) {
  const docs = structDocs(lang, sig);
  if (isClass(sig)) return docs + classStarter(lang, sig);
  const fn = entryName(lang, sig.name);
  const ret = defaultReturn(lang, sig.returns);
  const typed = (l) => sig.params.map((p) => `${p.name}: ${typeIn(l, p.type)}`).join(', ');
  switch (lang) {
    case 'python':
      return `${docs}def ${fn}(${sig.params.map((p) => `${snake(p.name)}: ${typeIn('python', p.type)}`).join(', ')}) -> ${typeIn('python', sig.returns)}:\n    # Your code here\n    pass\n`;
    case 'javascript': {
      const doc = sig.params.map((p) => ` * @param {${typeIn('javascript', p.type)}} ${p.name}`).join('\n');
      return `${docs}/**\n${doc}\n * @return {${typeIn('javascript', sig.returns)}}\n */\nfunction ${fn}(${sig.params.map((p) => p.name).join(', ')}) {\n  // Your code here\n}\n`;
    }
    case 'typescript':
      return `${docs}function ${fn}(${typed('typescript')}): ${typeIn('typescript', sig.returns)} {\n  // Your code here\n  return ${ret};\n}\n`;
    case 'java':
      return `${docs}class Solution {\n    public ${typeIn('java', sig.returns)} ${fn}(${sig.params.map((p) => `${typeIn('java', p.type)} ${p.name}`).join(', ')}) {\n        // Your code here\n        return ${ret};\n    }\n}\n`;
    case 'cpp':
      return `${docs}class Solution {\npublic:\n    ${typeIn('cpp', sig.returns)} ${fn}(${sig.params.map((p) => (parseType(p.type).dims ? `${typeIn('cpp', p.type)}& ${p.name}` : `${typeIn('cpp', p.type)} ${p.name}`)).join(', ')}) {\n        // Your code here\n        return ${ret};\n    }\n};\n`;
    case 'c': {
      const { ret: cret, extra } = cReturn(sig.returns);
      const params = [...sig.params.flatMap(cParams), ...extra].join(', ');
      const isArray = parseType(sig.returns).dims > 0;
      const note = isArray ? '/**\n * Note: the returned array must be malloced; the caller calls free().\n */\n' : '';
      return `${docs}${note}${cret} ${fn}(${params}) {\n    // Your code here\n${isArray ? '    *returnSize = 0;\n' : ''}    return ${ret};\n}\n`;
    }
    case 'csharp':
      return `${docs}public class Solution {\n    public ${typeIn('csharp', sig.returns)} ${fn}(${sig.params.map((p) => `${typeIn('csharp', p.type)} ${p.name}`).join(', ')}) {\n        // Your code here\n        return ${ret};\n    }\n}\n`;
    case 'go':
      return `${docs}func ${fn}(${sig.params.map((p) => `${p.name} ${typeIn('go', p.type)}`).join(', ')}) ${typeIn('go', sig.returns)} {\n    // Your code here\n    return ${ret}\n}\n`;
    default:
      throw new Error(`Unknown language "${lang}"`);
  }
}

/** Exported for the verifier's C harness generator. */
export const cSignatureParts = { cParams, cReturn };
