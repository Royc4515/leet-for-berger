// Builds a test program per language from a problem's neutral signature, so every shipped
// solution can be compiled and run against the problem's 15 cases.
//
// Python, JavaScript, TypeScript and Java read the cases as JSON. C, C++, Go and C# read a flat
// token stream produced by encodeCases(), which needs no JSON library in those languages:
//   number -> decimal token, bool -> 1/0, string -> "<utf8 byte length> <bytes>", array -> "<n> ...items".
// Every program prints one JSON value per case, one per line.
import { parseType, entryName, cSignatureParts } from '../../src/js/engine/codegen.js';

/**
 * @param {unknown[][]} cases each case is the argument list
 * @param {{ params: { type: string }[] }} sig
 */
export function encodeCases(cases, sig) {
  const out = [String(cases.length)];
  const put = (v, base, dims) => {
    if (dims > 0) {
      out.push(String(v.length));
      for (const x of v) put(x, base, dims - 1);
    } else if (base === 'string') {
      out.push(`${Buffer.byteLength(v)} ${v}`);
    } else if (base === 'bool') {
      out.push(v ? '1' : '0');
    } else {
      out.push(String(v));
    }
  };
  for (const args of cases) sig.params.forEach((p, i) => {
    const { base, dims } = parseType(p.type);
    put(args[i], base, dims);
  });
  return out.join(' ') + '\n';
}

const jsonRunner = (lang, sig) => `
const __fs = require('fs');
for (const __args of JSON.parse(__fs.readFileSync(0, 'utf8'))) {
  console.log(JSON.stringify(${lang === 'typescript' ? `(${entryName(lang, sig.name)} as (...a: any[]) => unknown)` : entryName(lang, sig.name)}(...__args)));
}
`;

/* ---------- C++ ---------- */
function cpp(sig, solution) {
  const reads = sig.params.map((p, i) => `        auto a${i} = R<${cppType(p.type)}>::get();`).join('\n');
  const call = `sol.${entryName('cpp', sig.name)}(${sig.params.map((_, i) => `a${i}`).join(', ')})`;
  return {
    files: {
      'main.cpp': `#include <bits/stdc++.h>
using namespace std;
${solution}
// ---- harness ----
static string IN_; static size_t P_ = 0;
static void ws_() { while (P_ < IN_.size() && isspace((unsigned char)IN_[P_])) P_++; }
static long long rdI_() { ws_(); char* e; long long v = strtoll(IN_.c_str() + P_, &e, 10); P_ = e - IN_.c_str(); return v; }
static double rdD_() { ws_(); char* e; double v = strtod(IN_.c_str() + P_, &e); P_ = e - IN_.c_str(); return v; }
template <class T> struct R;
template <> struct R<int> { static int get() { return (int)rdI_(); } };
template <> struct R<long long> { static long long get() { return rdI_(); } };
template <> struct R<double> { static double get() { return rdD_(); } };
template <> struct R<bool> { static bool get() { return rdI_() != 0; } };
template <> struct R<string> { static string get() { long long n = rdI_(); P_++; string s = IN_.substr(P_, n); P_ += n; return s; } };
template <class T> struct R<vector<T>> { static vector<T> get() { long long n = rdI_(); vector<T> v; v.reserve(n); for (long long i = 0; i < n; i++) v.push_back(R<T>::get()); return v; } };
static void W(ostream& o, int v) { o << v; }
static void W(ostream& o, long long v) { o << v; }
static void W(ostream& o, double v) { o << setprecision(17) << v; }
static void W(ostream& o, bool v) { o << (v ? "true" : "false"); }
static void W(ostream& o, const string& s) { o << '"'; for (unsigned char c : s) { if (c == '"' || c == '\\\\') o << '\\\\' << c; else if (c < 0x20) { char b[8]; snprintf(b, 8, "\\\\u%04x", c); o << b; } else o << c; } o << '"'; }
template <class T> static void W(ostream& o, const vector<T>& v) { o << '['; for (size_t i = 0; i < v.size(); i++) { if (i) o << ','; W(o, (T)v[i]); } o << ']'; }
int main() {
    ios::sync_with_stdio(false);
    IN_.assign(istreambuf_iterator<char>(cin), istreambuf_iterator<char>());
    long long cases = rdI_();
    for (long long c = 0; c < cases; c++) {
${reads}
        Solution sol;
        W(cout, ${call});
        cout << '\\n';
    }
}
`,
    },
    compile: ['g++', '-O2', '-std=c++17', '-o', 'main', 'main.cpp'],
    run: ['./main'],
  };
}
function cppType(type) {
  const { base, dims } = parseType(type);
  const s = { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'string' }[base];
  return dims === 0 ? s : dims === 1 ? `vector<${s}>` : `vector<vector<${s}>>`;
}

/* ---------- C ---------- */
const C_SCALAR = { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'char*' };
const C_READ = { int: '(int)rdI_()', long: 'rdI_()', double: 'rdD_()', bool: '(rdI_() != 0)', string: 'rdS_()' };
const C_WRITE = { int: 'printf("%d", X)', long: 'printf("%lld", X)', double: 'printf("%.17g", X)', bool: 'printf(X ? "true" : "false")', string: 'wS_(X)' };

function c(sig, solution) {
  const lines = [];
  const args = [];
  sig.params.forEach((p, i) => {
    const { base, dims } = parseType(p.type);
    const s = C_SCALAR[base];
    const v = `a${i}`;
    if (dims === 0) {
      lines.push(`        ${s} ${v} = ${C_READ[base]};`);
      args.push(v);
    } else if (dims === 1) {
      lines.push(`        int ${v}n = (int)rdI_(); ${s}* ${v} = malloc(sizeof(${s}) * (${v}n ? ${v}n : 1));`);
      lines.push(`        for (int i = 0; i < ${v}n; i++) ${v}[i] = ${C_READ[base]};`);
      args.push(v, `${v}n`);
    } else {
      lines.push(`        int ${v}n = (int)rdI_(); ${s}** ${v} = malloc(sizeof(${s}*) * (${v}n ? ${v}n : 1)); int* ${v}c = malloc(sizeof(int) * (${v}n ? ${v}n : 1));`);
      lines.push(`        for (int i = 0; i < ${v}n; i++) { ${v}c[i] = (int)rdI_(); ${v}[i] = malloc(sizeof(${s}) * (${v}c[i] ? ${v}c[i] : 1)); for (int j = 0; j < ${v}c[i]; j++) ${v}[i][j] = ${C_READ[base]}; }`);
      args.push(v, `${v}n`, `${v}c`);
    }
  });
  const { base, dims } = parseType(sig.returns);
  const fn = entryName('c', sig.name);
  const w = (x) => C_WRITE[base].replace('X', x);
  let callAndPrint;
  if (dims === 0) {
    callAndPrint = `        ${cSignatureParts.cReturn(sig.returns).ret} r = ${fn}(${args.join(', ')});\n        ${w('r')};`;
  } else if (dims === 1) {
    callAndPrint = `        int rn = 0; ${C_SCALAR[base]}* r = ${fn}(${[...args, '&rn'].join(', ')});\n        putchar('['); for (int i = 0; i < rn; i++) { if (i) putchar(','); ${w('r[i]')}; } putchar(']');`;
  } else {
    callAndPrint = `        int rn = 0; int* rc = NULL; ${C_SCALAR[base]}** r = ${fn}(${[...args, '&rn', '&rc'].join(', ')});\n        putchar('['); for (int i = 0; i < rn; i++) { if (i) putchar(','); putchar('['); for (int j = 0; j < rc[i]; j++) { if (j) putchar(','); ${w('r[i][j]')}; } putchar(']'); } putchar(']');`;
  }
  return {
    files: {
      'main.c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <limits.h>
${solution}
/* ---- harness ---- */
static char* IN_; static long P_, N_;
static void ws_(void) { while (P_ < N_ && isspace((unsigned char)IN_[P_])) P_++; }
static long long rdI_(void) { ws_(); char* e; long long v = strtoll(IN_ + P_, &e, 10); P_ = e - IN_; return v; }
static double rdD_(void) { ws_(); char* e; double v = strtod(IN_ + P_, &e); P_ = e - IN_; return v; }
static char* rdS_(void) { long long n = rdI_(); P_++; char* s = malloc(n + 1); memcpy(s, IN_ + P_, n); s[n] = 0; P_ += n; return s; }
static void wS_(const char* s) { putchar('"'); for (; *s; s++) { unsigned char ch = *s; if (ch == '"' || ch == '\\\\') { putchar('\\\\'); putchar(ch); } else if (ch < 0x20) printf("\\\\u%04x", ch); else putchar(ch); } putchar('"'); }
int main(void) {
    size_t cap = 1 << 20; IN_ = malloc(cap); N_ = 0; size_t k;
    while ((k = fread(IN_ + N_, 1, cap - N_ - 1, stdin)) > 0) { N_ += k; if (cap - N_ < 2) { cap *= 2; IN_ = realloc(IN_, cap); } }
    IN_[N_] = 0;
    long long cases = rdI_();
    for (long long t = 0; t < cases; t++) {
${lines.join('\n')}
${callAndPrint}
        putchar('\\n');
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
function goReader(type) {
  const { base, dims } = parseType(type);
  const scalar = { int: 'int(rdI())', long: 'rdI()', double: 'rdD()', bool: '(rdI() != 0)', string: 'rdS()' }[base];
  const goScalar = { int: 'int', long: 'int64', double: 'float64', bool: 'bool', string: 'string' }[base];
  if (dims === 0) return scalar;
  if (dims === 1) return `func() []${goScalar} { n := int(rdI()); v := make([]${goScalar}, n); for i := range v { v[i] = ${scalar} }; return v }()`;
  return `func() [][]${goScalar} { n := int(rdI()); v := make([][]${goScalar}, n); for i := range v { m := int(rdI()); v[i] = make([]${goScalar}, m); for j := range v[i] { v[i][j] = ${scalar} } }; return v }()`;
}
function go(sig, solution) {
  const reads = sig.params.map((p, i) => `\t\ta${i} := ${goReader(p.type)}`).join('\n');
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

var in_ []byte
var p_ int

func ws() { for p_ < len(in_) && unicode.IsSpace(rune(in_[p_])) { p_++ } }
func tok() string { ws(); s := p_; for p_ < len(in_) && !unicode.IsSpace(rune(in_[p_])) { p_++ }; return string(in_[s:p_]) }
func rdI() int64 { v, _ := strconv.ParseInt(tok(), 10, 64); return v }
func rdD() float64 { v, _ := strconv.ParseFloat(tok(), 64); return v }
func rdS() string { n := int(rdI()); p_++; s := string(in_[p_ : p_+n]); p_ += n; return s }

func write(w *bufio.Writer, v reflect.Value) {
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
${reads}
\t\twrite(w, reflect.ValueOf(${entryName('go', sig.name)}(${sig.params.map((_, i) => `a${i}`).join(', ')})))
\t\tw.WriteByte('\\n')
\t}
}
`,
    },
    compile: ['go', 'build', '-o', 'main', 'solution.go', 'harness.go'],
    run: ['./main'],
  };
}

/* ---------- C# ---------- */
function csReader(type) {
  const { base, dims } = parseType(type);
  const scalar = { int: '(int)RdI()', long: 'RdI()', double: 'RdD()', bool: '(RdI() != 0)', string: 'RdS()' }[base];
  const cs = { int: 'int', long: 'long', double: 'double', bool: 'bool', string: 'string' }[base];
  if (dims === 0) return scalar;
  if (dims === 1) return `Arr<${cs}>(() => ${scalar})`;
  return `Arr<${cs}[]>(() => Arr<${cs}>(() => ${scalar}))`;
}
function csharp(sig, solution, { dotnetMajor = 8 } = {}) {
  const reads = sig.params.map((p, i) => `            var a${i} = ${csReader(p.type)};`).join('\n');
  return {
    files: {
      'Solution.cs': solution,
      'Harness.csproj': `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net${dotnetMajor}.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>disable</Nullable><InvariantGlobalization>true</InvariantGlobalization></PropertyGroup></Project>`,
      'Program.cs': `using System.Globalization;
using System.Text;

static class Harness {
    static byte[] In_ = Array.Empty<byte>();
    static int P_;
    static void Ws() { while (P_ < In_.Length && char.IsWhiteSpace((char)In_[P_])) P_++; }
    static string Tok() { Ws(); int s = P_; while (P_ < In_.Length && !char.IsWhiteSpace((char)In_[P_])) P_++; return Encoding.ASCII.GetString(In_, s, P_ - s); }
    static long RdI() => long.Parse(Tok(), CultureInfo.InvariantCulture);
    static double RdD() => double.Parse(Tok(), CultureInfo.InvariantCulture);
    static string RdS() { int n = (int)RdI(); P_++; string s = Encoding.UTF8.GetString(In_, P_, n); P_ += n; return s; }
    static T[] Arr<T>(Func<T> item) { int n = (int)RdI(); var v = new T[n]; for (int i = 0; i < n; i++) v[i] = item(); return v; }
    static void W(StringBuilder o, object v) {
        switch (v) {
            case string s: o.Append(System.Text.Json.JsonSerializer.Serialize(s)); break;
            case bool b: o.Append(b ? "true" : "false"); break;
            case double d: o.Append(d.ToString("R", CultureInfo.InvariantCulture)); break;
            case System.Collections.IEnumerable e: o.Append('['); bool first = true; foreach (var x in e) { if (!first) o.Append(','); W(o, x); first = false; } o.Append(']'); break;
            default: o.Append(Convert.ToString(v, CultureInfo.InvariantCulture)); break;
        }
    }
    static void Main() {
        using (var ms = new MemoryStream()) { Console.OpenStandardInput().CopyTo(ms); In_ = ms.ToArray(); }
        var o = new StringBuilder();
        long cases = RdI();
        for (long c = 0; c < cases; c++) {
${reads}
            W(o, new Solution().${entryName('csharp', sig.name)}(${sig.params.map((_, i) => `a${i}`).join(', ')}));
            o.Append('\\n');
        }
        Console.Out.Write(o.ToString());
    }
}
`,
    },
    compile: ['dotnet', 'build', '-c', 'Release', '-o', 'out', '--nologo', '-v', 'q'],
    run: ['dotnet', 'out/Harness.dll'],
  };
}

/**
 * @param {string} lang
 * @param {{ name: string, params: { name: string, type: string }[], returns: string }} sig
 * @param {string} solution source of the solution file
 * @param {object} [opts]
 * @returns {{ files: Record<string, string>, compile: string[]|null, run: string[], input: 'json'|'tokens' }}
 */
export function buildHarness(lang, sig, solution, opts) {
  switch (lang) {
    case 'python':
      return {
        files: {
          'solution.py': solution,
          'main.py': `import json, sys\nsys.path.insert(0, '.')\nfrom solution import ${entryName('python', sig.name)} as fn\nfor args in json.load(sys.stdin):\n    print(json.dumps(fn(*args)))\n`,
        },
        compile: null,
        run: ['python3', '-I', 'main.py'],
        input: 'json',
      };
    case 'javascript':
      return { files: { 'main.js': solution + jsonRunner(lang, sig) }, compile: null, run: ['node', 'main.js'], input: 'json' };
    case 'typescript':
      return {
        files: { 'main.ts': `declare const require: any;\ndeclare const console: { log(...a: unknown[]): void };\n${solution}${jsonRunner(lang, sig)}` },
        compile: ['tsc', '--target', 'es2022', '--strict', '--noEmitOnError', '--lib', 'es2022', 'main.ts'],
        run: ['node', 'main.js'],
        input: 'json',
      };
    case 'java':
      return { files: { 'Solution.java': solution }, compile: 'java-harness', run: null, input: 'json' };
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
