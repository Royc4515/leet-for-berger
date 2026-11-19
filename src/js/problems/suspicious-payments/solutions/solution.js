// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.py
/**
 * O(n + sum of g^2) time for name groups of size g, O(n) space.
 * @param {string[]} payments
 * @return {string[]}
 */
function suspiciousPayments(payments) {
  const byName = new Map();
  const flagged = new Array(payments.length).fill(false);
  payments.forEach((p, i) => {
    const [name, rawMinute, rawAmount, city] = p.split(',');
    const minute = Number(rawMinute);
    if (Number(rawAmount) > 1000) flagged[i] = true;
    if (!byName.has(name)) byName.set(name, []);
    const group = byName.get(name);
    for (const [m, c, j] of group) {
      if (c !== city && Math.abs(minute - m) <= 60) {
        // A conflict makes both records suspicious, including the one seen earlier.
        flagged[i] = true;
        flagged[j] = true;
      }
    }
    group.push([minute, city, i]);
  });
  // Flags live on positions, so identical copies stay separate and input order is kept.
  return payments.filter((_, i) => flagged[i]);
}
