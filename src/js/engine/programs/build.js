// Builds a test program per language from a problem's neutral signature. The CI verifier
// (tests/solutions.test.js) compiles every shipped solution with it, and the remote runner
// (engine/runners/remote-runner.js, docs/adr/0005-remote-runner.md) sends the same program to the
// server, so what CI proves and what users run cannot drift. Browser-safe: no Node APIs.
//
// Python, JavaScript and TypeScript run the solution inside the same adapter the browser uses
// (src/js/engine/adapters.js). Java runs through Harness.java (reflection). C, C++, Go and C#
// read a flat token stream from encodeCases(), which needs no JSON library in those languages:
//   number -> decimal token, bool -> 1/0, string -> "<utf8 byte length> <bytes>",
//   array or ListNode -> "<n> ...items", TreeNode -> "<n>" then each item as a number or "n" (null),
//   design case -> "<ops>" then per operation its name (a string) and its arguments.
// Python, JavaScript and TypeScript print one JSON value per case, one per line. Java, C, C++, Go and
// C# use the case protocol in ./output.js: each result on its own line behind RESULT_MARK, flushed
// per case, and CASE_MARK on stderr before each case, so the user's own prints and a crash or timeout
// are attributed to the right case.
import { parseType, entryName, methodName, isClass, cSignatureParts, usesStruct } from '../codegen.js';
import { adapterFor } from '../adapters.js';
// ListNode@cycle, RandomListNode and NestedInteger[] (encoding and per-language code) live there.
import * as extra from './extra-types.js';
import { CASE_MARK, RESULT_MARK } from './output.js';

// The marks as string-literal source text. JSON escapes give "\n\u001e", valid in Go, C# and Java;
// C and C++ get an octal escape because \x is greedy there and would swallow following hex digits.
const lit = (s) => JSON.stringify(s).slice(1, -1);
const U_CASE = lit(CASE_MARK);
const U_RESULT = lit(RESULT_MARK);
const C_CASE = U_CASE.replaceAll('\\u001e', '\\036');
const C_RESULT = U_RESULT.replaceAll('\\u001e', '\\036');

const encoder = new TextEncoder();
/** UTF-8 byte length, without Node's Buffer. */
const utf8Length = (s) => encoder.encode(s).length;

/* ---------- token encoding (C, C++, Go, C#) ---------- */

function putValue(out, v, type) {
  if (extra.putExtra(out, v, type)) return;
  const { base, dims } = parseType(type);
  if (base === 'TreeNode') {
    out.push(String(v.length));
    for (const x of v) out.push(x === null ? 'n' : String(x));
    return;
  }
  if (dims > 0) {
    out.push(String(v.length));
    const inner = type.slice(0, -2);
    for (const x of v) putValue(out, x, inner);
  } else if (base === 'ListNode') {
    out.push(String(v.length));
    for (const x of v) out.push(String(x));
  } else if (base === 'string') {
    out.push(`${utf8Length(v)} ${v}`);
  } else if (base === 'bool') {
    out.push(v ? '1' : '0');
  } else {
    out.push(String(v));
  }
}

/**
 * @param {unknown[][]} cases each case is the argument list ([ops, argLists] for a class)
 * @param {object} sig
 */
export function encodeCases(cases, sig) {
  const out = [String(cases.length)];
  for (const args of cases) {
    if (isClass(sig)) {
      const [ops, opArgs] = args;
      out.push(String(ops.length));
      ops.forEach((op, i) => {
        putValue(out, op, 'string');
        const params = i === 0 ? sig.constructor.params : sig.methods.find((m) => m.name === op).params;
        params.forEach((p, j) => putValue(out, opArgs[i][j], p.type));
      });
    } else {
      sig.params.forEach((p, i) => putValue(out, args[i], p.type));
    }
  }
  return out.join(' ') + '\n';
}

/* ---------- Python / JavaScript / TypeScript (adapter-based) ---------- */

function jsMain(lang, sig, solution) {
  const ad = adapterFor(lang, sig);
  const call = ad ? ad.entry : entryName(lang, sig.name);
  const ts = lang === 'typescript';
  const fn = ts ? `(${call} as (...a: any[]) => unknown)` : call;
  const head = ts ? 'declare const require: any;\ndeclare const console: { log(...a: unknown[]): void };\n' : '';
  const body = ad ? `${ad.before}${solution}${ad.after}` : solution;
  return `${head}${body}
const __fs = require('fs');
for (const __args of JSON.parse(__fs.readFileSync(0, 'utf8'))) {
  console.log(JSON.stringify(${fn}(...__args)));
}
`;
}

function python(sig, solution) {
  const ad = adapterFor('python', sig);
  return {
    files: {
      'solution.py': solution,
      'before.py': ad ? ad.before : '',
      'after.py': ad ? ad.after : '',
      // Same three-step exec as the browser worker: adapter, user code, adapter.
      'main.py': `import json, sys
ns = {}
for part in ('before.py', 'solution.py', 'after.py'):
    with open(part) as f:
        exec(compile(f.read(), part, 'exec'), ns)
fn = ns[${JSON.stringify(ad ? ad.entry : entryName('python', sig.name))}]
for args in json.load(sys.stdin):
    print(json.dumps(fn(*args)))
`,
    },
    compile: null,
    run: ['python3', '-I', 'main.py'],
    input: 'json',
  };
}

/* ---------- C++ ---------- */

const CPP_SCALAR = { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'string', ListNode: 'ListNode*', TreeNode: 'TreeNode*' };
function cppType(type) {
  const { base, dims } = parseType(type);
  const s = CPP_SCALAR[base];
  return dims === 0 ? s : dims === 1 ? `vector<${s}>` : `vector<vector<${s}>>`;
}
const cppRead = (type) => extra.cppRead(type) ?? `R<${cppType(type)}>::get()`;

function cpp(sig, solution) {
  const caseBody = isClass(sig)
    ? (() => {
        const ctorReads = sig.constructor.params.map((p, j) => `auto c${j} = ${cppRead(p.type)}; `).join('');
        const branches = sig.methods
          .map((m) => {
            const reads = m.params.map((p, j) => `auto a${j} = ${cppRead(p.type)}; `).join('');
            const call = `obj->${m.name}(${m.params.map((_, j) => `a${j}`).join(', ')})`;
            return `if (op == "${m.name}") { ${reads}${m.returns === 'void' ? `${call}; o_ << "null";` : `W(o_, ${call});`} }`;
          })
          .join(' else ');
        return `        long long n = rdI_(); ${sig.name}* obj = nullptr; o_ << '[';
        for (long long i = 0; i < n; i++) {
            string op = R<string>::get(); if (i) o_ << ',';
            if (i == 0) { ${ctorReads}obj = new ${sig.name}(${sig.constructor.params.map((_, j) => `c${j}`).join(', ')}); o_ << "null"; continue; }
            ${branches} else { cerr << "unknown op " << op; return 1; }
        }
        o_ << ']';`;
      })()
    : `${sig.params.map((p, i) => `        auto a${i} = ${cppRead(p.type)};`).join('\n')}
        Solution sol;
        W(o_, sol.${entryName('cpp', sig.name)}(${sig.params.map((_, i) => `a${i}`).join(', ')}));`;
  return {
    files: {
      'main.cpp': `#include <bits/stdc++.h>
using namespace std;
struct ListNode { int val; ListNode *next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} ListNode(int x, ListNode *n) : val(x), next(n) {} };
struct TreeNode { int val; TreeNode *left; TreeNode *right; TreeNode() : val(0), left(nullptr), right(nullptr) {} TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {} };
${extra.cppTypes(sig)}${solution}
// ---- harness ----
static string IN_; static size_t P_ = 0;
static void ws_() { while (P_ < IN_.size() && isspace((unsigned char)IN_[P_])) P_++; }
static string tok_() { ws_(); size_t s = P_; while (P_ < IN_.size() && !isspace((unsigned char)IN_[P_])) P_++; return IN_.substr(s, P_ - s); }
static long long rdI_() { ws_(); char* e; long long v = strtoll(IN_.c_str() + P_, &e, 10); P_ = e - IN_.c_str(); return v; }
static double rdD_() { ws_(); char* e; double v = strtod(IN_.c_str() + P_, &e); P_ = e - IN_.c_str(); return v; }
template <class T> struct R;
template <> struct R<int> { static int get() { return (int)rdI_(); } };
template <> struct R<long long> { static long long get() { return rdI_(); } };
template <> struct R<double> { static double get() { return rdD_(); } };
template <> struct R<bool> { static bool get() { return rdI_() != 0; } };
template <> struct R<string> { static string get() { long long n = rdI_(); P_++; string s = IN_.substr(P_, n); P_ += n; return s; } };
template <> struct R<ListNode*> { static ListNode* get() { long long n = rdI_(); ListNode d; ListNode* t = &d; for (long long i = 0; i < n; i++) { t->next = new ListNode((int)rdI_()); t = t->next; } return d.next; } };
template <> struct R<TreeNode*> { static TreeNode* get() {
    long long n = rdI_(); vector<TreeNode*> it(n); for (long long i = 0; i < n; i++) { string t = tok_(); it[i] = t == "n" ? nullptr : new TreeNode(stoi(t)); }
    if (n == 0 || !it[0]) return nullptr; size_t k = 1; deque<TreeNode*> q{it[0]};
    while (!q.empty() && k < it.size()) { TreeNode* x = q.front(); q.pop_front(); if (k < it.size()) { x->left = it[k++]; if (x->left) q.push_back(x->left); } if (k < it.size()) { x->right = it[k++]; if (x->right) q.push_back(x->right); } }
    return it[0]; } };
template <class T> struct R<vector<T>> { static vector<T> get() { long long n = rdI_(); vector<T> v; v.reserve(n); for (long long i = 0; i < n; i++) v.push_back(R<T>::get()); return v; } };
static void W(ostream& o, int v) { o << v; }
static void W(ostream& o, long long v) { o << v; }
static void W(ostream& o, double v) { o << setprecision(17) << v; }
static void W(ostream& o, bool v) { o << (v ? "true" : "false"); }
static void W(ostream& o, const string& s) { o << '"'; for (unsigned char c : s) { if (c == '"' || c == '\\\\') o << '\\\\' << c; else if (c < 0x20) { char b[8]; snprintf(b, 8, "\\\\u%04x", c); o << b; } else o << c; } o << '"'; }
static void W(ostream& o, ListNode* n) { o << '['; for (size_t k = 0; n; n = n->next, k++) { if (k > 1000000) throw runtime_error("cycle"); if (k) o << ','; o << n->val; } o << ']'; }
static void W(ostream& o, TreeNode* r) {
    vector<TreeNode*> q; if (r) q.push_back(r); vector<string> out;
    for (size_t h = 0; h < q.size(); h++) { if (!q[h]) { out.push_back("null"); continue; } out.push_back(to_string(q[h]->val)); q.push_back(q[h]->left); q.push_back(q[h]->right); }
    while (!out.empty() && out.back() == "null") out.pop_back();
    o << '['; for (size_t i = 0; i < out.size(); i++) { if (i) o << ','; o << out[i]; } o << ']'; }
template <class T> static void W(ostream& o, const vector<T>& v) { o << '['; for (size_t i = 0; i < v.size(); i++) { if (i) o << ','; W(o, (T)v[i]); } o << ']'; }
${extra.cppHelpers(sig)}int main() {
    ios::sync_with_stdio(false);
    IN_.assign(istreambuf_iterator<char>(cin), istreambuf_iterator<char>());
    long long cases = rdI_();
    for (long long c = 0; c < cases; c++) {
        cerr << "${C_CASE}" << flush;
        ostringstream o_;
${caseBody}
        // The user's printf output has its own buffer: flush it first so it stays before the result.
        fflush(stdout);
        cout << "${C_RESULT}" << o_.str() << '\\n' << flush;
    }
}
`,
    },
    compile: ['g++', '-O2', '-std=c++17', '-o', 'main', 'main.cpp'],
    run: ['./main'],
  };
}

/* ---------- C ---------- */

const C_SCALAR = { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'char*', ListNode: 'struct ListNode*', TreeNode: 'struct TreeNode*' };
const C_READ = { int: '(int)rdI_()', long: 'rdI_()', double: 'rdD_()', bool: '(rdI_() != 0)', string: 'rdS_()', ListNode: 'rdList_()', TreeNode: 'rdTree_()' };
const C_WRITE = { int: 'printf("%d", X)', long: 'printf("%lld", X)', double: 'printf("%.17g", X)', bool: 'printf(X ? "true" : "false")', string: 'wS_(X)', ListNode: 'wList_(X)', TreeNode: 'wTree_(X)' };

/** Declarations that read one neutral param into C locals; returns the call arguments. */
function cReadParam(type, v, lines) {
  const ex = extra.cReadExtra(type, v, lines);
  if (ex) return ex;
  const { base, dims } = parseType(type);
  const s = C_SCALAR[base];
  if (dims === 0) {
    lines.push(`${s} ${v} = ${C_READ[base]};`);
    return [v];
  }
  if (dims === 1) {
    lines.push(`int ${v}n = (int)rdI_(); ${s}* ${v} = malloc(sizeof(${s}) * (${v}n ? ${v}n : 1)); for (int i_ = 0; i_ < ${v}n; i_++) ${v}[i_] = ${C_READ[base]};`);
    return [v, `${v}n`];
  }
  lines.push(`int ${v}n = (int)rdI_(); ${s}** ${v} = malloc(sizeof(${s}*) * (${v}n ? ${v}n : 1)); int* ${v}c = malloc(sizeof(int) * (${v}n ? ${v}n : 1));`);
  lines.push(`for (int i_ = 0; i_ < ${v}n; i_++) { ${v}c[i_] = (int)rdI_(); ${v}[i_] = malloc(sizeof(${s}) * (${v}c[i_] ? ${v}c[i_] : 1)); for (int j_ = 0; j_ < ${v}c[i_]; j_++) ${v}[i_][j_] = ${C_READ[base]}; }`);
  return [v, `${v}n`, `${v}c`];
}

/**
 * Calls a C function with the given args and prints its result as JSON. `mark` is written between
 * the call and the result (the result mark for a function problem, nothing inside a design case).
 */
function cCallAndPrint(fn, args, returns, mark = '') {
  if (returns === 'void') return `${fn}(${args.join(', ')}); ${mark}printf("null");`;
  const { base, dims } = parseType(returns);
  const w = (x) => (extra.cWriteExtra(base) ?? C_WRITE[base]).replace('X', x);
  if (dims === 0) return `{ ${cSignatureParts.cReturn(returns).ret} r_ = ${fn}(${args.join(', ')}); ${mark}${w('r_')}; }`;
  if (dims === 1) return `{ int rn_ = 0; ${C_SCALAR[base]}* r_ = ${fn}(${[...args, '&rn_'].join(', ')}); ${mark}putchar('['); for (int i_ = 0; i_ < rn_; i_++) { if (i_) putchar(','); ${w('r_[i_]')}; } putchar(']'); }`;
  return `{ int rn_ = 0; int* rc_ = NULL; ${C_SCALAR[base]}** r_ = ${fn}(${[...args, '&rn_', '&rc_'].join(', ')}); ${mark}putchar('['); for (int i_ = 0; i_ < rn_; i_++) { if (i_) putchar(','); putchar('['); for (int j_ = 0; j_ < rc_[i_]; j_++) { if (j_) putchar(','); ${w('r_[i_][j_]')}; } putchar(']'); } putchar(']'); }`;
}
// In a design case the user's methods run between writes, so prints from them land inside the result
// line; the runner reports that line as unreadable output and points to stderr.
const C_MARK = `fputs("${C_RESULT}", stdout); `;

function c(sig, solution) {
  let body;
  if (isClass(sig)) {
    const C = sig.name;
    const ctorLines = [];
    const ctorArgs = sig.constructor.params.flatMap((p, j) => cReadParam(p.type, `c${j}`, ctorLines));
    const branches = sig.methods
      .map((m) => {
        const lines = [];
        const args = ['obj', ...m.params.flatMap((p, j) => cReadParam(p.type, `a${j}`, lines))];
        return `if (strcmp(op, "${m.name}") == 0) { ${lines.join(' ')} ${cCallAndPrint(methodName('c', C, m.name), args, m.returns)} }`;
      })
      .join(' else ');
    body = `        long long n = rdI_(); ${C}* obj = NULL; ${C_MARK}putchar('[');
        for (long long i = 0; i < n; i++) {
            char* op = rdS_(); if (i) putchar(',');
            if (i == 0) { ${ctorLines.join(' ')} obj = ${methodName('c', C, 'create')}(${ctorArgs.join(', ')}); printf("null"); continue; }
            ${branches} else { fprintf(stderr, "unknown op %s", op); return 1; }
        }
        putchar(']'); ${methodName('c', C, 'free')}(obj);`;
  } else {
    const lines = [];
    const args = sig.params.flatMap((p, i) => cReadParam(p.type, `a${i}`, lines));
    body = `        ${lines.join('\n        ')}\n        ${cCallAndPrint(entryName('c', sig.name), args, sig.returns, C_MARK)}`;
  }
  return {
    files: {
      'main.c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <limits.h>
struct ListNode { int val; struct ListNode *next; };
struct TreeNode { int val; struct TreeNode *left; struct TreeNode *right; };
${extra.cTypes(sig)}${solution}
/* ---- harness ---- */
static char* IN_; static long P_, N_;
static void ws_(void) { while (P_ < N_ && isspace((unsigned char)IN_[P_])) P_++; }
static long long rdI_(void) { ws_(); char* e; long long v = strtoll(IN_ + P_, &e, 10); P_ = e - IN_; return v; }
static double rdD_(void) { ws_(); char* e; double v = strtod(IN_ + P_, &e); P_ = e - IN_; return v; }
static char* rdS_(void) { long long n = rdI_(); P_++; char* s = malloc(n + 1); memcpy(s, IN_ + P_, n); s[n] = 0; P_ += n; return s; }
static struct ListNode* rdList_(void) { long long n = rdI_(); struct ListNode d; struct ListNode* t = &d; d.next = NULL; for (long long i = 0; i < n; i++) { t->next = calloc(1, sizeof(struct ListNode)); t = t->next; t->val = (int)rdI_(); } return d.next; }
static struct TreeNode* rdTree_(void) {
    long long n = rdI_(); struct TreeNode** it = malloc(sizeof(struct TreeNode*) * (n ? n : 1));
    for (long long i = 0; i < n; i++) { ws_(); if (IN_[P_] == 'n') { P_++; it[i] = NULL; } else { it[i] = calloc(1, sizeof(struct TreeNode)); it[i]->val = (int)rdI_(); } }
    if (n == 0 || !it[0]) return NULL;
    struct TreeNode** q = malloc(sizeof(struct TreeNode*) * n); long qh = 0, qt = 0, k = 1; q[qt++] = it[0];
    while (qh < qt && k < n) { struct TreeNode* x = q[qh++]; if (k < n) { x->left = it[k++]; if (x->left) q[qt++] = x->left; } if (k < n) { x->right = it[k++]; if (x->right) q[qt++] = x->right; } }
    return it[0]; }
static void wS_(const char* s) { putchar('"'); for (; *s; s++) { unsigned char ch = *s; if (ch == '"' || ch == '\\\\') { putchar('\\\\'); putchar(ch); } else if (ch < 0x20) printf("\\\\u%04x", ch); else putchar(ch); } putchar('"'); }
static void wList_(struct ListNode* n) { putchar('['); for (long k = 0; n; n = n->next, k++) { if (k) putchar(','); printf("%d", n->val); } putchar(']'); }
static void wTree_(struct TreeNode* r) {
    long cap = 1024, qt = 0, last = -1; struct TreeNode** q = malloc(sizeof(struct TreeNode*) * cap); char* isNull = malloc(cap);
    if (r) { q[qt] = r; isNull[qt++] = 0; }
    for (long h = 0; h < qt; h++) { if (isNull[h]) continue; last = h; if (qt + 2 > cap) { cap *= 2; q = realloc(q, sizeof(struct TreeNode*) * cap); isNull = realloc(isNull, cap); }
        struct TreeNode* kids[2] = { q[h]->left, q[h]->right }; for (int s = 0; s < 2; s++) { q[qt] = kids[s]; isNull[qt++] = kids[s] == NULL; } }
    putchar('['); for (long h = 0; h <= last; h++) { if (h) putchar(','); if (isNull[h]) printf("null"); else printf("%d", q[h]->val); } putchar(']'); }
${extra.cHelpers(sig)}int main(void) {
    size_t cap = 1 << 20; IN_ = malloc(cap); N_ = 0; size_t k;
    while ((k = fread(IN_ + N_, 1, cap - N_ - 1, stdin)) > 0) { N_ += k; if (cap - N_ < 2) { cap *= 2; IN_ = realloc(IN_, cap); } }
    IN_[N_] = 0;
    long long cases = rdI_();
    for (long long t = 0; t < cases; t++) {
        fputs("${C_CASE}", stderr);
${body}
        putchar('\\n'); fflush(stdout);
    }
    return 0;
}
`,
    },
    compile: ['gcc', '-O2', '-std=c11', '-o', 'main', 'main.c', '-lm'],
    run: ['./main'],
  };
}

/* ---------- Go ---------- */

const GO_SCALAR = { int: 'int', long: 'int64', double: 'float64', bool: 'bool', string: 'string', ListNode: '*ListNode', TreeNode: '*TreeNode' };
function goReader(type) {
  const ex = extra.goRead(type);
  if (ex) return ex;
  const { base, dims } = parseType(type);
  const scalar = { int: 'int(rdI())', long: 'rdI()', double: 'rdD()', bool: '(rdI() != 0)', string: 'rdS()', ListNode: 'rdList()', TreeNode: 'rdTree()' }[base];
  const g = GO_SCALAR[base];
  if (dims === 0) return scalar;
  if (dims === 1) return `func() []${g} { n := int(rdI()); v := make([]${g}, n); for i := range v { v[i] = ${scalar} }; return v }()`;
  return `func() [][]${g} { n := int(rdI()); v := make([][]${g}, n); for i := range v { m := int(rdI()); v[i] = make([]${g}, m); for j := range v[i] { v[i][j] = ${scalar} } }; return v }()`;
}

function go(sig, solution) {
  let body;
  if (isClass(sig)) {
    const ctor = sig.constructor.params.map((p, j) => `c${j} := ${goReader(p.type)}; `).join('');
    const cases = sig.methods
      .map((m) => {
        const reads = m.params.map((p, j) => `a${j} := ${goReader(p.type)}; `).join('');
        const call = `obj.${methodName('go', sig.name, m.name)}(${m.params.map((_, j) => `a${j}`).join(', ')})`;
        return `\t\t\tcase "${m.name}": ${reads}${m.returns === 'void' ? `${call}; w.WriteString("null")` : `write(w, reflect.ValueOf(${call}))`}`;
      })
      .join('\n');
    body = `\t\tn := int(rdI()); var obj ${sig.name}; w.WriteByte('[')
\t\tfor i := 0; i < n; i++ {
\t\t\top := rdS(); if i > 0 { w.WriteByte(',') }
\t\t\tif i == 0 { ${ctor}obj = Constructor(${sig.constructor.params.map((_, j) => `c${j}`).join(', ')}); w.WriteString("null"); continue }
\t\t\tswitch op {
${cases}
\t\t\tdefault: panic("unknown op " + op)
\t\t\t}
\t\t}
\t\tw.WriteByte(']')`;
  } else {
    body = `${sig.params.map((p, i) => `\t\ta${i} := ${goReader(p.type)}`).join('\n')}
\t\twrite(w, reflect.ValueOf(${entryName('go', sig.name)}(${sig.params.map((_, i) => `a${i}`).join(', ')})))`;
  }
  return {
    files: {
      'solution.go': `package main\n\n${solution}`,
      'harness.go': `package main

import (
\t"bufio"
\t"encoding/json"
\t"io"
\t"os"
\t"reflect"
\t"strconv"
\t"unicode"
)

type ListNode struct {
\tVal  int
\tNext *ListNode
}

type TreeNode struct {
\tVal   int
\tLeft  *TreeNode
\tRight *TreeNode
}

var in_ []byte
var p_ int

func ws() { for p_ < len(in_) && unicode.IsSpace(rune(in_[p_])) { p_++ } }
func tok() string { ws(); s := p_; for p_ < len(in_) && !unicode.IsSpace(rune(in_[p_])) { p_++ }; return string(in_[s:p_]) }
func rdI() int64 { v, _ := strconv.ParseInt(tok(), 10, 64); return v }
func rdD() float64 { v, _ := strconv.ParseFloat(tok(), 64); return v }
func rdS() string { n := int(rdI()); p_++; s := string(in_[p_ : p_+n]); p_ += n; return s }
func rdList() *ListNode { n := int(rdI()); d := &ListNode{}; t := d; for i := 0; i < n; i++ { t.Next = &ListNode{Val: int(rdI())}; t = t.Next }; return d.Next }
func rdTree() *TreeNode {
\tn := int(rdI()); it := make([]*TreeNode, n)
\tfor i := range it { t := tok(); if t != "n" { v, _ := strconv.Atoi(t); it[i] = &TreeNode{Val: v} } }
\tif n == 0 || it[0] == nil { return nil }
\tq := []*TreeNode{it[0]}; k := 1
\tfor h := 0; h < len(q) && k < n; h++ { x := q[h]; if k < n { x.Left = it[k]; k++; if x.Left != nil { q = append(q, x.Left) } }; if k < n { x.Right = it[k]; k++; if x.Right != nil { q = append(q, x.Right) } } }
\treturn it[0]
}

var listType = reflect.TypeOf((*ListNode)(nil))
var treeType = reflect.TypeOf((*TreeNode)(nil))

func write(w *bufio.Writer, v reflect.Value) {
${extra.goWriteHook(sig)}\tif v.Type() == listType {
\t\tw.WriteByte('['); first := true
\t\tfor n := v.Interface().(*ListNode); n != nil; n = n.Next { if !first { w.WriteByte(',') }; w.WriteString(strconv.Itoa(n.Val)); first = false }
\t\tw.WriteByte(']'); return
\t}
\tif v.Type() == treeType {
\t\tvar out []string; var q []*TreeNode
\t\tif r := v.Interface().(*TreeNode); r != nil { q = append(q, r) }
\t\tfor h := 0; h < len(q); h++ { if q[h] == nil { out = append(out, "null"); continue }; out = append(out, strconv.Itoa(q[h].Val)); q = append(q, q[h].Left, q[h].Right) }
\t\tfor len(out) > 0 && out[len(out)-1] == "null" { out = out[:len(out)-1] }
\t\tw.WriteByte('['); for i, s := range out { if i > 0 { w.WriteByte(',') }; w.WriteString(s) }; w.WriteByte(']'); return
\t}
\tswitch v.Kind() {
\tcase reflect.Slice:
\t\tw.WriteByte('[')
\t\tfor i := 0; i < v.Len(); i++ { if i > 0 { w.WriteByte(',') }; write(w, v.Index(i)) }
\t\tw.WriteByte(']')
\tcase reflect.String:
\t\tb, _ := json.Marshal(v.String()); w.Write(b)
\tcase reflect.Bool:
\t\tw.WriteString(strconv.FormatBool(v.Bool()))
\tcase reflect.Float64:
\t\tw.WriteString(strconv.FormatFloat(v.Float(), 'g', -1, 64))
\tdefault:
\t\tw.WriteString(strconv.FormatInt(v.Int(), 10))
\t}
}

func main() {
\tin_, _ = io.ReadAll(os.Stdin)
\tw := bufio.NewWriterSize(os.Stdout, 1<<20)
\tdefer w.Flush()
\tcases := int(rdI())
\tfor c := 0; c < cases; c++ {
\t\tos.Stderr.WriteString("${U_CASE}")
\t\t// Buffered until the case ends, so prints the user's code makes during the case come first.
\t\tw.WriteString("${U_RESULT}")
${body}
\t\tw.WriteByte('\\n')
\t\tw.Flush()
\t}
}
${extra.goHelpers(sig)}`,
    },
    compile: ['go', 'build', '-o', 'main', 'solution.go', 'harness.go'],
    run: ['./main'],
  };
}

/* ---------- C# ---------- */

const CS_SCALAR = { int: 'int', long: 'long', double: 'double', bool: 'bool', string: 'string', ListNode: 'ListNode', TreeNode: 'TreeNode' };
function csReader(type) {
  const ex = extra.csRead(type);
  if (ex) return ex;
  const { base, dims } = parseType(type);
  const scalar = { int: '(int)RdI()', long: 'RdI()', double: 'RdD()', bool: '(RdI() != 0)', string: 'RdS()', ListNode: 'RdList()', TreeNode: 'RdTree()' }[base];
  const cs = CS_SCALAR[base];
  if (dims === 0) return scalar;
  if (dims === 1) return `Arr<${cs}>(() => ${scalar})`;
  return `Arr<${cs}[]>(() => Arr<${cs}>(() => ${scalar}))`;
}

/** Writes a C# call's result; a null list or tree is the empty structure, so it prints []. */
function csWrite(type, call) {
  const { base, dims } = parseType(type);
  if ((base === 'ListNode' || base === 'TreeNode' || base === 'RandomListNode') && dims === 0) return `{ var r_ = ${call}; if (r_ == null) o.Append("[]"); else W(o, r_); }`;
  return `W(o, ${call});`;
}

function csharp(sig, solution, { dotnetMajor = 8 } = {}) {
  let body;
  if (isClass(sig)) {
    const ctor = sig.constructor.params.map((p, j) => `var c${j} = ${csReader(p.type)}; `).join('');
    const cases = sig.methods
      .map((m) => {
        const reads = m.params.map((p, j) => `var a${j} = ${csReader(p.type)}; `).join('');
        const call = `obj.${methodName('csharp', sig.name, m.name)}(${m.params.map((_, j) => `a${j}`).join(', ')})`;
        return `                    case "${m.name}": { ${reads}${m.returns === 'void' ? `${call}; o.Append("null");` : csWrite(m.returns, call)} break; }`;
      })
      .join('\n');
    body = `            long n = RdI(); ${sig.name} obj = null; o.Append('[');
            for (long i = 0; i < n; i++) {
                string op = RdS(); if (i > 0) o.Append(',');
                if (i == 0) { ${ctor}obj = new ${sig.name}(${sig.constructor.params.map((_, j) => `c${j}`).join(', ')}); o.Append("null"); continue; }
                switch (op) {
${cases}
                    default: throw new Exception("unknown op " + op);
                }
            }
            o.Append(']');`;
  } else {
    body = `${sig.params.map((p, i) => `            var a${i} = ${csReader(p.type)};`).join('\n')}
            ${csWrite(sig.returns, `new Solution().${entryName('csharp', sig.name)}(${sig.params.map((_, i) => `a${i}`).join(', ')})`)}`;
  }
  return {
    files: {
      'Solution.cs': solution,
      'Harness.csproj': `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net${dotnetMajor}.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>disable</Nullable><InvariantGlobalization>true</InvariantGlobalization></PropertyGroup></Project>`,
      'Program.cs': `using System.Globalization;
using System.Text;

public class ListNode { public int val; public ListNode next; public ListNode(int val = 0, ListNode next = null) { this.val = val; this.next = next; } }
public class TreeNode { public int val; public TreeNode left; public TreeNode right; public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null) { this.val = val; this.left = left; this.right = right; } }
${extra.csTypes(sig)}
static class Harness {
    static byte[] In_ = Array.Empty<byte>();
    static int P_;
    static void Ws() { while (P_ < In_.Length && char.IsWhiteSpace((char)In_[P_])) P_++; }
    static string Tok() { Ws(); int s = P_; while (P_ < In_.Length && !char.IsWhiteSpace((char)In_[P_])) P_++; return Encoding.ASCII.GetString(In_, s, P_ - s); }
    static long RdI() => long.Parse(Tok(), CultureInfo.InvariantCulture);
    static double RdD() => double.Parse(Tok(), CultureInfo.InvariantCulture);
    static string RdS() { int n = (int)RdI(); P_++; string s = Encoding.UTF8.GetString(In_, P_, n); P_ += n; return s; }
    static T[] Arr<T>(Func<T> item) { int n = (int)RdI(); var v = new T[n]; for (int i = 0; i < n; i++) v[i] = item(); return v; }
    static ListNode RdList() { int n = (int)RdI(); var d = new ListNode(); var t = d; for (int i = 0; i < n; i++) { t.next = new ListNode((int)RdI()); t = t.next; } return d.next; }
    static TreeNode RdTree() {
        int n = (int)RdI(); var it = new TreeNode[n];
        for (int i = 0; i < n; i++) { var t = Tok(); it[i] = t == "n" ? null : new TreeNode(int.Parse(t, CultureInfo.InvariantCulture)); }
        if (n == 0 || it[0] == null) return null;
        var q = new Queue<TreeNode>(); q.Enqueue(it[0]); int k = 1;
        while (q.Count > 0 && k < n) { var x = q.Dequeue(); if (k < n) { x.left = it[k++]; if (x.left != null) q.Enqueue(x.left); } if (k < n) { x.right = it[k++]; if (x.right != null) q.Enqueue(x.right); } }
        return it[0];
    }
    static void W(StringBuilder o, object v) {
        switch (v) {
            case null: o.Append("null"); break;
            case string s: o.Append(System.Text.Json.JsonSerializer.Serialize(s)); break;
            case bool b: o.Append(b ? "true" : "false"); break;
            case double d: o.Append(d.ToString("R", CultureInfo.InvariantCulture)); break;
            case ListNode ln: { o.Append('['); bool first = true; for (var n = ln; n != null; n = n.next) { if (!first) o.Append(','); o.Append(n.val); first = false; } o.Append(']'); break; }
            case TreeNode tn: {
                var outv = new List<string>(); var q = new List<TreeNode> { tn };
                for (int h = 0; h < q.Count; h++) { if (q[h] == null) { outv.Add("null"); continue; } outv.Add(q[h].val.ToString(CultureInfo.InvariantCulture)); q.Add(q[h].left); q.Add(q[h].right); }
                while (outv.Count > 0 && outv[^1] == "null") outv.RemoveAt(outv.Count - 1);
                o.Append('[').Append(string.Join(",", outv)).Append(']'); break;
            }
${extra.csWriteCase(sig)}            case System.Collections.IEnumerable e: o.Append('['); bool f = true; foreach (var x in e) { if (!f) o.Append(','); W(o, x); f = false; } o.Append(']'); break;
            default: o.Append(Convert.ToString(v, CultureInfo.InvariantCulture)); break;
        }
    }
${extra.csHelpers(sig)}    static void Main() {
        using (var ms = new MemoryStream()) { Console.OpenStandardInput().CopyTo(ms); In_ = ms.ToArray(); }
        var o = new StringBuilder();
        long cases = RdI();
        for (long c = 0; c < cases; c++) {
            Console.Error.Write("${U_CASE}");
            // Written when the case ends, so prints the user's code makes during the case come first.
            o.Append("${U_RESULT}");
${body}
            o.Append('\\n');
            Console.Out.Write(o.ToString());
            Console.Out.Flush();
            o.Clear();
        }
    }
}
`,
    },
    compile: ['dotnet', 'build', '-c', 'Release', '-o', 'out', '--nologo', '-v', 'q'],
    run: ['dotnet', 'out/Harness.dll'],
  };
}

/**
 * Test program for a language whose solution runs as a script or through an adapter (Python,
 * JavaScript, TypeScript: verifier only), or a native one (C, C++, Go, C#; buildProgram is the
 * entry point for those and for Java).
 * @param {string} lang
 * @param {object} sig neutral signature (function or class)
 * @param {string} solution source of the solution file
 * @param {{ dotnetMajor?: number }} [opts]
 * @returns {{ files: Record<string, string>, compile: string[]|null, run: string[], input: 'json'|'tokens' }}
 */
export function buildHarness(lang, sig, solution, opts) {
  switch (lang) {
    case 'python':
      return python(sig, solution);
    case 'javascript':
      return { files: { 'main.js': jsMain(lang, sig, solution) }, compile: null, run: ['node', 'main.js'], input: 'json' };
    case 'typescript':
      return {
        files: { 'main.ts': jsMain(lang, sig, solution) },
        compile: ['tsc', '--target', 'es2022', '--strict', '--noEmitOnError', '--lib', 'es2022', 'main.ts'],
        run: ['node', 'main.js'],
        input: 'json',
      };
    case 'cpp':
      return { ...cpp(sig, solution), input: 'tokens' };
    case 'c':
      return { ...c(sig, solution), input: 'tokens' };
    case 'go':
      return { ...go(sig, solution), input: 'tokens' };
    case 'csharp':
      return { ...csharp(sig, solution, opts), input: 'tokens' };
    default:
      throw new Error(`No harness for ${lang}`);
  }
}

/** Languages whose programs follow the case protocol in ./output.js. */
export const NATIVE_LANGUAGES = ['java', 'cpp', 'c', 'go', 'csharp'];

/**
 * Java files compiled with every Java solution, from ./java/. The structure classes are always
 * included: the harness refers to them, as do solutions. Callers load the text (fs in the verifier,
 * fetch in the browser) and pass it in, which keeps this module free of I/O.
 */
export const JAVA_SUPPORT_FILES = ['Harness.java', 'ListNode.java', 'TreeNode.java', 'RandomListNode.java', 'NestedInteger.java'];

/**
 * @typedef {Object} Program
 * @property {string} language          our language id
 * @property {Record<string, string>} files  file name -> content; all files sit in one directory
 * @property {string[]} compile         compile command, run in that directory
 * @property {string[]} run             run command, run in that directory; stdin is programStdin()
 * @property {string[]} args            the tail of `run` that depends on the problem; the rest is fixed
 *                                      per language (the server's run script holds it)
 * @property {'json'|'tokens'} input
 * @property {string} solutionFile      the file that holds the user's code
 * @property {number} solutionLine      1-based line where the user's code starts in that file
 */

/**
 * The complete test program for a native language (Java, C, C++, Go, C#): what the verifier
 * compiles in CI and what the remote runner sends to the server.
 * @param {string} lang
 * @param {object} sig neutral signature
 * @param {string} solution the user's or the shipped solution's source
 * @param {{ javaSupport?: Record<string, string>, dotnetMajor?: number }} [opts]
 * @returns {Program}
 */
export function buildProgram(lang, sig, solution, { javaSupport, dotnetMajor } = {}) {
  let program;
  if (lang === 'java') {
    const missing = JAVA_SUPPORT_FILES.filter((f) => typeof javaSupport?.[f] !== 'string');
    if (missing.length) throw new Error(`Java support files missing: ${missing.join(', ')}`);
    const files = { 'Solution.java': solution };
    for (const f of JAVA_SUPPORT_FILES) files[f] = javaSupport[f];
    program = {
      files,
      compile: ['javac', '-d', '.', ...Object.keys(files)],
      // Deep recursion is a deliberate pitfall in some problems, not a JVM default to trip over.
      run: ['java', '-Xss64m', '-cp', '.', 'Harness', sig.name],
      args: [sig.name],
      input: 'json',
    };
  } else if (NATIVE_LANGUAGES.includes(lang)) {
    const h = buildHarness(lang, sig, solution, { dotnetMajor });
    program = { files: h.files, compile: h.compile, run: h.run, args: [], input: h.input };
  } else {
    throw new Error(`No native program for ${lang}`);
  }
  const [solutionFile, solutionLine] = locate(program.files, solution);
  return { language: lang, ...program, solutionFile, solutionLine };
}

/** Where the solution text sits, so compiler messages can be mapped back to the user's lines. */
function locate(files, solution) {
  for (const [name, content] of Object.entries(files)) {
    const at = solution ? content.indexOf(solution) : -1;
    if (at >= 0) return [name, content.slice(0, at).split('\n').length];
  }
  return [Object.keys(files)[0], 1];
}

/**
 * The program's stdin for these cases: JSON for Java, the token stream for the others.
 * @param {Program} program
 * @param {unknown[][]} cases argument lists, in suite order
 * @param {object} sig
 */
export function programStdin(program, cases, sig) {
  return program.input === 'json' ? JSON.stringify(cases) : encodeCases(cases, sig);
}
