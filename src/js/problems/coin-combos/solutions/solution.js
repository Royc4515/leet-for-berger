// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0518.Coin%20Change%20II/Solution.ts
/**
 * O(amount * coins) time, O(amount) space. The coin loop is outside, so every combination is
 * built in one fixed coin order and counted once.
 * @param {number} amount
 * @param {number[]} coins
 * @return {number}
 */
function change(amount, coins) {
  const MOD = 1000000007;
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) ways[a] = (ways[a] + ways[a - c]) % MOD;
  }
  return ways[amount];
}
