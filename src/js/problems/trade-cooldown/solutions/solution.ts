// O(n) time, O(1) space. Three states at the end of each day: holding a share, having sold
// today, or resting with no share. A buy may only follow a rest day, never a sale.
function maxProfit(prices: number[]): number {
  let hold = -prices[0];
  let sold = 0;
  let rest = 0;
  for (let i = 1; i < prices.length; i++) {
    const p = prices[i];
    [hold, sold, rest] = [Math.max(hold, rest - p), hold + p, Math.max(rest, sold)];
  }
  return Math.max(sold, rest);
}
