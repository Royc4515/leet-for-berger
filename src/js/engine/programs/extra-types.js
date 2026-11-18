// Native harness support for the types beyond int arrays, ListNode and TreeNode:
//   ListNode@cycle   tokens "<n> v1..vn <pos>"                   built with the tail linked to pos
//   RandomListNode   tokens "<n>" then per node "<val> <random>"  random -1 for null
//   NestedInteger[]  tokens "<n>" then per item "i <val>" or "l" and a nested list, recursively
// Kept apart from harnesses.mjs, which only calls in here, so each harness emits this code only
// for a signature that uses the type and every other problem's program stays byte for byte as before.
//
// A copied RandomListNode list is checked against the input nodes by identity. Instead of the list,
// the program prints one of COPY_MARKERS (the same strings as the JS and Python adapters), so a
// solution that returns the original nodes, or points a random pointer outside its copy, gets a
// wrong answer whatever its values look like.
import { parseType, typesUsed, usesStruct } from '../codegen.js';
import { COPY_MARKERS } from '../adapters.js';

const SHARED = JSON.stringify(COPY_MARKERS.sharedNode);
const OUTSIDE = JSON.stringify(COPY_MARKERS.outsideRandom);

const usesCycle = (sig) => typesUsed(sig).some((t) => parseType(t).cycle);

function putNested(out, list) {
  out.push(String(list.length));
  for (const x of list) {
    if (Array.isArray(x)) {
      out.push('l');
      putNested(out, x);
    } else out.push('i', String(x));
  }
}

/**
 * Token encoding for the extra types. Returns false for every other type.
 * @param {string[]} out
 * @param {unknown} v JSON value
 * @param {string} type neutral type
 */
export function putExtra(out, v, type) {
  const { base, cycle } = parseType(type);
  if (cycle) {
    out.push(String(v[0].length), ...v[0].map(String), String(v[1]));
    return true;
  }
  if (base === 'RandomListNode') {
    out.push(String(v.length));
    for (const [val, r] of v) out.push(String(val), r === null ? '-1' : String(r));
    return true;
  }
  if (base === 'NestedInteger') {
    putNested(out, v);
    return true;
  }
  return false;
}

/* ---------- C++ ---------- */

/** Read expression for an extra type, or null. */
export function cppRead(type) {
  const { base, cycle } = parseType(type);
  if (cycle) return 'rdCycle_()';
  if (base === 'RandomListNode') return 'rdRandom_()';
  if (base === 'NestedInteger') return 'rdNestedList_()';
  return null;
}

/** Definitions placed before the solution. */
export function cppTypes(sig) {
  let s = '';
  if (usesStruct(sig, 'RandomListNode')) {
    s += 'struct RandomListNode { int val; RandomListNode *next; RandomListNode *random; RandomListNode() : val(0), next(nullptr), random(nullptr) {} RandomListNode(int x) : val(x), next(nullptr), random(nullptr) {} };\n';
  }
  if (usesStruct(sig, 'NestedInteger')) {
    s += `class NestedInteger {
    bool int_; int val_; vector<NestedInteger> list_;
public:
    explicit NestedInteger(int v) : int_(true), val_(v) {}
    explicit NestedInteger(vector<NestedInteger> l) : int_(false), val_(0), list_(std::move(l)) {}
    bool isInteger() const { return int_; }
    int getInteger() const { return val_; }
    const vector<NestedInteger>& getList() const { return list_; }
};
`;
  }
  return s;
}

/** Readers and writers placed after the generic harness helpers, before main(). */
export function cppHelpers(sig) {
  let s = '';
  if (usesCycle(sig)) {
    s += `static ListNode* rdCycle_() { long long n = rdI_(); vector<ListNode*> it(n); for (long long i = 0; i < n; i++) it[i] = new ListNode((int)rdI_());
    for (long long i = 0; i + 1 < n; i++) it[i]->next = it[i + 1]; long long pos = rdI_(); if (pos >= 0 && n > 0) it[n - 1]->next = it[pos]; return n ? it[0] : nullptr; }
`;
  }
  if (usesStruct(sig, 'RandomListNode')) {
    s += `static unordered_set<RandomListNode*> GIVEN_;
static RandomListNode* rdRandom_() {
    long long n = rdI_(); vector<RandomListNode*> it(n); for (long long i = 0; i < n; i++) it[i] = new RandomListNode(0);
    GIVEN_.clear();
    for (long long i = 0; i < n; i++) { it[i]->val = (int)rdI_(); long long r = rdI_(); it[i]->random = r < 0 ? nullptr : it[r]; it[i]->next = i + 1 < n ? it[i + 1] : nullptr; GIVEN_.insert(it[i]); }
    return n ? it[0] : nullptr; }
static void W(ostream& o, RandomListNode* h) {
    unordered_map<RandomListNode*, long long> idx; vector<RandomListNode*> order;
    for (RandomListNode* x = h; x; x = x->next) { if (GIVEN_.count(x)) { W(o, string(${SHARED})); return; } if (idx.count(x)) throw runtime_error("cycle"); idx[x] = (long long)order.size(); order.push_back(x); }
    ostringstream b; b << '[';
    for (size_t i = 0; i < order.size(); i++) { RandomListNode* r = order[i]->random; if (i) b << ',';
        if (!r) { b << '[' << order[i]->val << ",null]"; continue; }
        if (GIVEN_.count(r)) { W(o, string(${SHARED})); return; }
        auto f = idx.find(r); if (f == idx.end()) { W(o, string(${OUTSIDE})); return; }
        b << '[' << order[i]->val << ',' << f->second << ']'; }
    b << ']'; o << b.str(); }
`;
  }
  if (usesStruct(sig, 'NestedInteger')) {
    s += `static vector<NestedInteger> rdNestedList_() { long long n = rdI_(); vector<NestedInteger> v; v.reserve(n);
    for (long long i = 0; i < n; i++) { string t = tok_(); if (t == "l") v.push_back(NestedInteger(rdNestedList_())); else v.push_back(NestedInteger((int)rdI_())); } return v; }
`;
  }
  return s;
}

/* ---------- C ---------- */

/** Reads one extra-type param into C locals; returns the call arguments, or null for other types. */
export function cReadExtra(type, v, lines) {
  const { base, cycle } = parseType(type);
  if (cycle) {
    lines.push(`struct ListNode* ${v} = rdCycle_();`);
    return [v];
  }
  if (base === 'RandomListNode') {
    lines.push(`struct RandomListNode* ${v} = rdRandom_();`);
    return [v];
  }
  if (base === 'NestedInteger') {
    lines.push(`int ${v}n = (int)rdI_(); struct NestedInteger** ${v} = malloc(sizeof(struct NestedInteger*) * (${v}n ? ${v}n : 1)); for (int i_ = 0; i_ < ${v}n; i_++) ${v}[i_] = rdNested_();`);
    return [v, `${v}n`];
  }
  return null;
}

/** Printer for an extra return type (format string X replaced by the value), or null. */
export function cWriteExtra(base) {
  return base === 'RandomListNode' ? 'wRandom_(X)' : null;
}

/** Definitions placed before the solution: the structs and the NestedInteger accessors it may call. */
export function cTypes(sig) {
  let s = '';
  if (usesStruct(sig, 'RandomListNode')) s += 'struct RandomListNode { int val; struct RandomListNode *next; struct RandomListNode *random; };\n';
  if (usesStruct(sig, 'NestedInteger')) {
    s += `struct NestedInteger { bool isInt; int val; struct NestedInteger** list; int size; };
bool nestedIntegerIsInteger(struct NestedInteger* n) { return n->isInt; }
int nestedIntegerGetInteger(struct NestedInteger* n) { return n->val; }
struct NestedInteger** nestedIntegerGetList(struct NestedInteger* n) { return n->list; }
int nestedIntegerGetListSize(struct NestedInteger* n) { return n->size; }
`;
  }
  return s;
}

/** Readers and writers placed after the generic harness helpers, before main(). */
export function cHelpers(sig) {
  let s = '';
  if (usesCycle(sig)) {
    s += `static struct ListNode* rdCycle_(void) {
    long long n = rdI_(); struct ListNode* it = calloc(n ? n : 1, sizeof(struct ListNode));
    for (long long i = 0; i < n; i++) { it[i].val = (int)rdI_(); it[i].next = i + 1 < n ? &it[i + 1] : NULL; }
    long long pos = rdI_(); if (pos >= 0 && n > 0) it[n - 1].next = &it[pos]; return n ? it : NULL; }
`;
  }
  if (usesStruct(sig, 'RandomListNode')) {
    // Input nodes live in one block, so "is this an input node" is a range check, and the output
    // walk maps nodes to indices with a sorted pointer table (C has no hash map).
    s += `#include <stdint.h>
static struct RandomListNode* GIVEN_; static long long GIVEN_N_;
static struct RandomListNode* rdRandom_(void) {
    long long n = rdI_(); GIVEN_ = calloc(n ? n : 1, sizeof(struct RandomListNode)); GIVEN_N_ = n;
    for (long long i = 0; i < n; i++) { GIVEN_[i].val = (int)rdI_(); long long r = rdI_(); GIVEN_[i].random = r < 0 ? NULL : &GIVEN_[r]; GIVEN_[i].next = i + 1 < n ? &GIVEN_[i + 1] : NULL; }
    return n ? GIVEN_ : NULL; }
static int isGiven_(struct RandomListNode* p) { return GIVEN_N_ > 0 && (uintptr_t)p >= (uintptr_t)GIVEN_ && (uintptr_t)p < (uintptr_t)(GIVEN_ + GIVEN_N_); }
typedef struct { uintptr_t p; long long i; } PIdx_;
static int pidxCmp_(const void* a, const void* b) { uintptr_t x = ((const PIdx_*)a)->p, y = ((const PIdx_*)b)->p; return x < y ? -1 : x > y; }
static void wRandom_(struct RandomListNode* h) {
    long long n = 0, cap = 1024; struct RandomListNode** order = malloc(sizeof(struct RandomListNode*) * cap);
    for (struct RandomListNode* x = h; x; x = x->next) {
        if (isGiven_(x)) { wS_(${SHARED}); return; }
        if (n > 4000000) { fprintf(stderr, "Returned list has a cycle"); exit(1); }
        if (n == cap) { cap *= 2; order = realloc(order, sizeof(struct RandomListNode*) * cap); }
        order[n++] = x; }
    PIdx_* idx = malloc(sizeof(PIdx_) * (n ? n : 1)); long long* rnd = malloc(sizeof(long long) * (n ? n : 1));
    for (long long i = 0; i < n; i++) { idx[i].p = (uintptr_t)order[i]; idx[i].i = i; }
    qsort(idx, n, sizeof(PIdx_), pidxCmp_);
    for (long long i = 0; i < n; i++) { struct RandomListNode* r = order[i]->random; rnd[i] = -1; if (!r) continue;
        if (isGiven_(r)) { wS_(${SHARED}); return; }
        PIdx_ key = { (uintptr_t)r, 0 }; PIdx_* f = bsearch(&key, idx, n, sizeof(PIdx_), pidxCmp_);
        if (!f) { wS_(${OUTSIDE}); return; } rnd[i] = f->i; }
    putchar('['); for (long long i = 0; i < n; i++) { if (i) putchar(','); if (rnd[i] < 0) printf("[%d,null]", order[i]->val); else printf("[%d,%lld]", order[i]->val, rnd[i]); } putchar(']');
    free(order); free(idx); free(rnd); }
`;
  }
  if (usesStruct(sig, 'NestedInteger')) {
    s += `static struct NestedInteger* rdNested_(void) {
    ws_(); struct NestedInteger* x = calloc(1, sizeof(struct NestedInteger)); char tag = IN_[P_++];
    if (tag == 'i') { x->isInt = true; x->val = (int)rdI_(); return x; }
    x->size = (int)rdI_(); x->list = malloc(sizeof(struct NestedInteger*) * (x->size ? x->size : 1));
    for (int i = 0; i < x->size; i++) x->list[i] = rdNested_();
    return x; }
`;
  }
  return s;
}

/* ---------- Go ---------- */

/** Read expression for an extra type, or null. */
export function goRead(type) {
  const { base, cycle } = parseType(type);
  if (cycle) return 'rdCycle()';
  if (base === 'RandomListNode') return 'rdRandom()';
  if (base === 'NestedInteger') return 'rdNestedList()';
  return null;
}

/** Types and helpers appended to harness.go. */
export function goHelpers(sig) {
  let s = '';
  if (usesCycle(sig)) {
    s += `
func rdCycle() *ListNode {
\tn := int(rdI()); it := make([]*ListNode, n)
\tfor i := range it { it[i] = &ListNode{Val: int(rdI())} }
\tfor i := 0; i+1 < n; i++ { it[i].Next = it[i+1] }
\tif pos := int(rdI()); pos >= 0 && n > 0 { it[n-1].Next = it[pos] }
\tif n == 0 { return nil }
\treturn it[0]
}
`;
  }
  if (usesStruct(sig, 'RandomListNode')) {
    s += `
type RandomListNode struct {
\tVal    int
\tNext   *RandomListNode
\tRandom *RandomListNode
}

var given = map[*RandomListNode]bool{}

func rdRandom() *RandomListNode {
\tn := int(rdI()); it := make([]*RandomListNode, n)
\tfor i := range it { it[i] = &RandomListNode{} }
\tgiven = map[*RandomListNode]bool{}
\tfor i := range it {
\t\tit[i].Val = int(rdI())
\t\tif r := int(rdI()); r >= 0 { it[i].Random = it[r] }
\t\tif i+1 < n { it[i].Next = it[i+1] }
\t\tgiven[it[i]] = true
\t}
\tif n == 0 { return nil }
\treturn it[0]
}

func writeRandom(w *bufio.Writer, h *RandomListNode) {
\tmarker := func(s string) { b, _ := json.Marshal(s); w.Write(b) }
\tidx := map[*RandomListNode]int{}; var order []*RandomListNode
\tfor x := h; x != nil; x = x.Next {
\t\tif given[x] { marker(${SHARED}); return }
\t\tif _, seen := idx[x]; seen { panic("Returned list has a cycle") }
\t\tidx[x] = len(order); order = append(order, x)
\t}
\tbuf := []byte{'['}
\tfor i, x := range order {
\t\tif i > 0 { buf = append(buf, ',') }
\t\tbuf = append(buf, '['); buf = strconv.AppendInt(buf, int64(x.Val), 10); buf = append(buf, ',')
\t\tif x.Random == nil { buf = append(buf, "null]"...); continue }
\t\tif given[x.Random] { marker(${SHARED}); return }
\t\tj, ok := idx[x.Random]
\t\tif !ok { marker(${OUTSIDE}); return }
\t\tbuf = strconv.AppendInt(buf, int64(j), 10); buf = append(buf, ']')
\t}
\tw.Write(append(buf, ']'))
}
`;
  }
  if (usesStruct(sig, 'NestedInteger')) {
    s += `
type NestedInteger struct {
\tisInt bool
\tval   int
\tlist  []*NestedInteger
}

func (n NestedInteger) IsInteger() bool { return n.isInt }
func (n NestedInteger) GetInteger() int { return n.val }
func (n NestedInteger) GetList() []*NestedInteger { return n.list }

func rdNestedList() []*NestedInteger {
\tn := int(rdI()); v := make([]*NestedInteger, n)
\tfor i := range v {
\t\tif tok() == "l" { v[i] = &NestedInteger{list: rdNestedList()} } else { v[i] = &NestedInteger{isInt: true, val: int(rdI())} }
\t}
\treturn v
}
`;
  }
  return s;
}

/** First lines of write(): extra return types handled before the generic reflection walk. */
export function goWriteHook(sig) {
  if (!usesStruct(sig, 'RandomListNode')) return '';
  return '\tif r, ok := v.Interface().(*RandomListNode); ok { writeRandom(w, r); return }\n';
}

/* ---------- C# ---------- */

/** Read expression for an extra type, or null. */
export function csRead(type) {
  const { base, cycle } = parseType(type);
  if (cycle) return 'RdCycle()';
  if (base === 'RandomListNode') return 'RdRandom()';
  if (base === 'NestedInteger') return 'RdNestedList()';
  return null;
}

/** Type definitions placed next to ListNode and TreeNode in Program.cs. */
export function csTypes(sig) {
  let s = '';
  if (usesStruct(sig, 'RandomListNode')) {
    s += 'public class RandomListNode { public int val; public RandomListNode next; public RandomListNode random; public RandomListNode(int val = 0, RandomListNode next = null, RandomListNode random = null) { this.val = val; this.next = next; this.random = random; } }\n';
  }
  if (usesStruct(sig, 'NestedInteger')) {
    s += `public interface NestedInteger { bool IsInteger(); int GetInteger(); IList<NestedInteger> GetList(); }
class NestedIntegerImpl : NestedInteger {
    readonly bool isInt; readonly int val; readonly IList<NestedInteger> list;
    public NestedIntegerImpl(int v) { isInt = true; val = v; list = new List<NestedInteger>(); }
    public NestedIntegerImpl(IList<NestedInteger> l) { list = l; }
    public bool IsInteger() => isInt;
    public int GetInteger() => val;
    public IList<NestedInteger> GetList() => list;
}
`;
  }
  return s;
}

/** Static members added to the Harness class. */
export function csHelpers(sig) {
  let s = '';
  if (usesCycle(sig)) {
    s += `    static ListNode RdCycle() {
        int n = (int)RdI(); var it = new ListNode[n];
        for (int i = 0; i < n; i++) it[i] = new ListNode((int)RdI());
        for (int i = 0; i + 1 < n; i++) it[i].next = it[i + 1];
        int pos = (int)RdI(); if (pos >= 0 && n > 0) it[n - 1].next = it[pos];
        return n > 0 ? it[0] : null;
    }
`;
  }
  if (usesStruct(sig, 'RandomListNode')) {
    s += `    static HashSet<RandomListNode> Given = new HashSet<RandomListNode>(ReferenceEqualityComparer.Instance);
    static RandomListNode RdRandom() {
        int n = (int)RdI(); var it = new RandomListNode[n];
        for (int i = 0; i < n; i++) it[i] = new RandomListNode();
        Given.Clear();
        for (int i = 0; i < n; i++) { it[i].val = (int)RdI(); int r = (int)RdI(); it[i].random = r < 0 ? null : it[r]; it[i].next = i + 1 < n ? it[i + 1] : null; Given.Add(it[i]); }
        return n > 0 ? it[0] : null;
    }
    static void WRandom(StringBuilder o, RandomListNode h) {
        var idx = new Dictionary<RandomListNode, int>(ReferenceEqualityComparer.Instance); var order = new List<RandomListNode>();
        for (var x = h; x != null; x = x.next) { if (Given.Contains(x)) { W(o, ${SHARED}); return; } if (idx.ContainsKey(x)) throw new Exception("Returned list has a cycle"); idx[x] = order.Count; order.Add(x); }
        var b = new StringBuilder("[");
        for (int i = 0; i < order.Count; i++) {
            var r = order[i].random; if (i > 0) b.Append(',');
            if (r == null) { b.Append('[').Append(order[i].val).Append(",null]"); continue; }
            if (Given.Contains(r)) { W(o, ${SHARED}); return; }
            if (!idx.TryGetValue(r, out int j)) { W(o, ${OUTSIDE}); return; }
            b.Append('[').Append(order[i].val).Append(',').Append(j).Append(']');
        }
        o.Append(b.Append(']'));
    }
`;
  }
  if (usesStruct(sig, 'NestedInteger')) {
    s += `    static IList<NestedInteger> RdNestedList() {
        int n = (int)RdI(); var v = new List<NestedInteger>(n);
        for (int i = 0; i < n; i++) v.Add(Tok() == "l" ? new NestedIntegerImpl(RdNestedList()) : new NestedIntegerImpl((int)RdI()));
        return v;
    }
`;
  }
  return s;
}

/** A case of W()'s type switch for extra return types (placed before the IEnumerable case). */
export function csWriteCase(sig) {
  return usesStruct(sig, 'RandomListNode') ? '            case RandomListNode rn: WRandom(o, rn); break;\n' : '';
}
