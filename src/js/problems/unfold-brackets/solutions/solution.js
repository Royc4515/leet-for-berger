/**
 * O(n + m) time for input length n and output length m: one shared buffer, and a closing bracket
 * repeats only the part written since its opening bracket. The buffer is an array of pieces, not
 * a string: slicing a string built by `+=` makes the engine flatten all of it first, which turns
 * every closing bracket into a copy of the whole output so far (quadratic).
 * @param {string} s
 * @return {string}
 */
var unfoldBrackets = function (s) {
  const out = []; // one character per slot, joined once at the end
  const starts = []; // where each open group begins in out
  const counts = []; // how many times each open group repeats
  let k = 0;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      // Counts can have several digits.
      k = k * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === '[') {
      starts.push(out.length);
      counts.push(k);
      k = 0;
    } else if (ch === ']') {
      const start = starts.pop();
      const end = out.length;
      // The group is already in the buffer once, so add count - 1 more copies.
      for (let r = counts.pop() - 1; r > 0; r--) {
        for (let i = start; i < end; i++) out.push(out[i]);
      }
    } else {
      out.push(ch);
    }
  }
  return out.join('');
};
