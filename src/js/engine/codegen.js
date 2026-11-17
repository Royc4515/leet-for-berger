/**
 * Language-neutral signatures -> per-language names, types and starter code.
 *
 * A problem declares its function once, with neutral types:
 *   { name: 'twoSum', params: [{ name: 'nums', type: 'int[]' }, ...], returns: 'int[]' }
 * Everything language-specific is derived here, so adding a problem never means writing
 * starter code eight times, and adding a language never means touching every problem.
 *
 * Neutral types: int, long, double, bool, string, and arrays of them up to two dimensions
 * (int[], string[][], ...). Pure module: no DOM, safe under node --test.
 */

export const BASE_TYPES = ['int', 'long', 'double', 'bool', 'string'];

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

/**
 * @param {string} type e.g. 'int[][]'
 * @returns {{ base: string, dims: number }}
 */
export function parseType(type) {
  const m = /^([a-z]+)((?:\[\])*)$/.exec(type);
  if (!m || !BASE_TYPES.includes(m[1])) throw new Error(`Unknown type "${type}"`);
  const dims = m[2].length / 2;
  if (dims > 2) throw new Error(`Type "${type}" has more than 2 dimensions`);
  return { base: m[1], dims };
}

/**
 * Structural check for a signature. Returns errors; empty means valid.
 * @param {{ name: string, params: { name: string, type: string }[], returns: string }} sig
 */
export function validateSignature(sig) {
  const errors = [];
  if (!/^[a-z][A-Za-z0-9]*$/.test(sig?.name ?? '')) errors.push('name must be camelCase');
  const names = new Set();
  for (const p of sig?.params ?? []) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(p.name)) errors.push(`param ${p.name}: name must be camelCase`);
    if (names.has(p.name)) errors.push(`param ${p.name}: duplicate`);
    names.add(p.name);
    try {
      parseType(p.type);
    } catch (e) {
      errors.push(`param ${p.name}: ${e.message}`);
    }
  }
  try {
    parseType(sig?.returns ?? '');
  } catch (e) {
    errors.push(`returns: ${e.message}`);
  }
  return errors;
}

const snake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const pascal = (s) => s[0].toUpperCase() + s.slice(1);

/**
 * The function or method name each language expects (Python snake_case, C# PascalCase).
 * @param {string} lang
 * @param {string} name camelCase base name
 */
export function entryName(lang, name) {
  if (lang === 'python') return snake(name);
  if (lang === 'csharp') return pascal(name);
  return name;
}

const SCALAR = {
  python: { int: 'int', long: 'int', double: 'float', bool: 'bool', string: 'str' },
  javascript: { int: 'number', long: 'number', double: 'number', bool: 'boolean', string: 'string' },
  typescript: { int: 'number', long: 'number', double: 'number', bool: 'boolean', string: 'string' },
  java: { int: 'int', long: 'long', double: 'double', bool: 'boolean', string: 'String' },
  cpp: { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'string' },
  c: { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'char*' },
  csharp: { int: 'int', long: 'long', double: 'double', bool: 'bool', string: 'string' },
  go: { int: 'int', long: 'int64', double: 'float64', bool: 'bool', string: 'string' },
};

/**
 * A neutral type written in a language (C is handled separately: arrays expand into params).
 * @param {string} lang
 * @param {string} type
 */
export function typeIn(lang, type) {
  const { base, dims } = parseType(type);
  const s = SCALAR[lang][base];
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
  const { base, dims } = parseType(type);
  const s = SCALAR.c[base];
  if (dims === 0) return { ret: s, extra: [] };
  if (dims === 1) return { ret: `${s}*`, extra: ['int* returnSize'] };
  return { ret: `${s}**`, extra: ['int* returnSize', 'int** returnColumnSizes'] };
}

/** A value of the type that compiles as a placeholder return. */
function defaultReturn(lang, type) {
  const { base, dims } = parseType(type);
  if (dims === 0) {
    const scalar = { int: '0', long: '0', double: '0.0', bool: 'false', string: '""' }[base];
    if (lang === 'java' && base === 'long') return '0L';
    if (lang === 'python') return { int: '0', long: '0', double: '0.0', bool: 'False', string: '""' }[base];
    return scalar;
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

/**
 * Starter code for one language: the signature, a placeholder body, nothing else.
 * @param {string} lang
 * @param {{ name: string, params: { name: string, type: string }[], returns: string }} sig
 */
export function starterCode(lang, sig) {
  const fn = entryName(lang, sig.name);
  const ret = defaultReturn(lang, sig.returns);
  const typed = (l) => sig.params.map((p) => `${p.name}: ${typeIn(l, p.type)}`).join(', ');
  switch (lang) {
    case 'python':
      return `def ${fn}(${sig.params.map((p) => `${snake(p.name)}: ${typeIn('python', p.type)}`).join(', ')}) -> ${typeIn('python', sig.returns)}:\n    # Your code here\n    pass\n`;
    case 'javascript': {
      const doc = sig.params.map((p) => ` * @param {${typeIn('javascript', p.type)}} ${p.name}`).join('\n');
      return `/**\n${doc}\n * @return {${typeIn('javascript', sig.returns)}}\n */\nfunction ${fn}(${sig.params.map((p) => p.name).join(', ')}) {\n  // Your code here\n}\n`;
    }
    case 'typescript':
      return `function ${fn}(${typed('typescript')}): ${typeIn('typescript', sig.returns)} {\n  // Your code here\n  return ${ret};\n}\n`;
    case 'java':
      return `class Solution {\n    public ${typeIn('java', sig.returns)} ${fn}(${sig.params.map((p) => `${typeIn('java', p.type)} ${p.name}`).join(', ')}) {\n        // Your code here\n        return ${ret};\n    }\n}\n`;
    case 'cpp':
      return `class Solution {\npublic:\n    ${typeIn('cpp', sig.returns)} ${fn}(${sig.params.map((p) => (parseType(p.type).dims ? `${typeIn('cpp', p.type)}& ${p.name}` : `${typeIn('cpp', p.type)} ${p.name}`)).join(', ')}) {\n        // Your code here\n        return ${ret};\n    }\n};\n`;
    case 'c': {
      const { ret: cret, extra } = cReturn(sig.returns);
      const params = [...sig.params.flatMap(cParams), ...extra].join(', ');
      const note = parseType(sig.returns).dims ? '/**\n * Note: the returned array must be malloced; the caller calls free().\n */\n' : '';
      const sizeLine = parseType(sig.returns).dims ? '    *returnSize = 0;\n' : '';
      return `${note}${cret} ${fn}(${params}) {\n    // Your code here\n${sizeLine}    return ${ret};\n}\n`;
    }
    case 'csharp':
      return `public class Solution {\n    public ${typeIn('csharp', sig.returns)} ${fn}(${sig.params.map((p) => `${typeIn('csharp', p.type)} ${p.name}`).join(', ')}) {\n        // Your code here\n        return ${ret};\n    }\n}\n`;
    case 'go':
      return `func ${fn}(${sig.params.map((p) => `${p.name} ${typeIn('go', p.type)}`).join(', ')}) ${typeIn('go', sig.returns)} {\n    // Your code here\n    return ${ret};\n}\n`.replace(';\n}', '\n}');
    default:
      throw new Error(`Unknown language "${lang}"`);
  }
}

/** Exported for the verifier's C harness generator. */
export const cSignatureParts = { cParams, cReturn };
