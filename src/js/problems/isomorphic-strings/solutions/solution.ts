// O(n) time - one map per direction; each catches a different kind of collision.
function isIsomorphic(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const fwd = new Map<string, string>();
  const back = new Map<string, string>();
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    const b = t[i];
    // fwd catches one source with two targets; back catches two sources with one target.
    if ((fwd.has(a) && fwd.get(a) !== b) || (back.has(b) && back.get(b) !== a)) return false;
    fwd.set(a, b);
    back.set(b, a);
  }
  return true;
}
