/**
 * O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
 * @param {number} n
 * @param {number} maxDepth
 * @return {string[]}
 */
var balancedPairs = function (n, maxDepth) {
  const out = [];
  const path = [];
  const dfs = (opened, closed) => {
    if (path.length === 2 * n) {
      out.push(path.join(''));
      return;
    }
    // Open while pairs remain and the depth (opened - closed) is under the limit.
    // "(" is tried first because it sorts before ")", which keeps the output in order.
    if (opened < n && opened - closed < maxDepth) {
      path.push('(');
      dfs(opened + 1, closed);
      path.pop();
    }
    // Close only while something is open.
    if (closed < opened) {
      path.push(')');
      dfs(opened, closed + 1);
      path.pop();
    }
  };
  dfs(0, 0);
  return out;
};
