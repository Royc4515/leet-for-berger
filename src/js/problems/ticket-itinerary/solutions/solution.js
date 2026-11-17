// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0332.Reconstruct%20Itinerary/Solution.ts
/**
 * O(E log E) - Hierholzer's algorithm. Destinations are stored in descending order so the
 * smallest unused one is always at the end, where pop() is O(1).
 * @param {string[][]} tickets
 * @return {string[]}
 */
function findItinerary(tickets) {
  const g = new Map();
  // Plain code-unit comparison: localeCompare can order strings differently from the
  // lexicographic order the problem asks for.
  const sorted = [...tickets].sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0));
  for (const [f, t] of sorted) {
    if (!g.has(f)) g.set(f, []);
    g.get(f).push(t);
  }
  // An explicit stack instead of recursion: the walk can be 3 * 10^4 tickets deep, more than
  // a browser's call stack holds.
  const stack = ['JFK'];
  const ans = [];
  while (stack.length) {
    const next = g.get(stack[stack.length - 1]);
    if (next && next.length) {
      stack.push(next.pop());
    } else {
      // No tickets left here, so this airport comes after everything still on the stack:
      // the route is built back to front.
      ans.push(stack.pop());
    }
  }
  return ans.reverse();
}
