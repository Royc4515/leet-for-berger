/**
 * O(n + m) time for input length n and output length m: one shared buffer, and a closing bracket
 * repeats only the slice written since its opening bracket.
 * @param {string} s
 * @return {string}
 */
var unfoldBrackets = function (s) {
  let out = '';
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
      // The group is already in the buffer once, so add count - 1 more copies.
      out += out.slice(start).repeat(counts.pop() - 1);
    } else {
      out += ch;
    }
  }
  return out;
};
