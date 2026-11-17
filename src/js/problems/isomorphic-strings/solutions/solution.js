/**
 * O(n) time - one map per direction; each catches a different kind of collision.
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;
  const fwd = new Map();
  const back = new Map();
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
