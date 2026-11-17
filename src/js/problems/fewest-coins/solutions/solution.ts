// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0322.Coin%20Change/Solution.ts
// O(amount * coins.length) time - the best way to pay a ends with some coin c, after paying a - c.
function coinChange(coins: number[], amount: number): number {
  // amount + 1 coins is impossible (every coin is at least 1), so it doubles as "unreachable".
  const inf = amount + 1;
  const f: number[] = new Array(amount + 1).fill(inf);
  f[0] = 0;
  // Coins in the outer loop: each pass allows one more denomination, reused any number of times.
  for (const x of coins) {
    for (let j = x; j <= amount; ++j) f[j] = Math.min(f[j], f[j - x] + 1);
  }
  return f[amount] >= inf ? -1 : f[amount];
}
