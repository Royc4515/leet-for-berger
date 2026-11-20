/**
 * O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first, and a dot
 * sorts before any digit, so the answers come out in dictionary order.
 * @param {string} s
 * @return {string[]}
 */
var dottedQuads = function (s) {
  const out = [];
  const parts = [];
  const dfs = (pos) => {
    const left = 4 - parts.length;
    const rest = s.length - pos;
    // Each remaining part takes 1 to 3 digits; anything else is a dead end.
    if (rest < left || rest > left * 3) return;
    if (left === 0) {
      out.push(parts.join('.'));
      return;
    }
    for (let len = 1; len <= 3; len++) {
      const part = s.slice(pos, pos + len);
      // A leading zero is allowed only for the single digit "0".
      if (len > 1 && part[0] === '0') break;
      if (Number(part) > 255) break;
      parts.push(part);
      dfs(pos + len);
      parts.pop();
    }
  };
  dfs(0);
  return out;
};
