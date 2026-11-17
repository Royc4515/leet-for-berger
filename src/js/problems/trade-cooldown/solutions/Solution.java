class Solution {
    // O(n) time, O(1) space. Three states at the end of each day: holding a share, having sold
    // today, or resting with no share. A buy may only follow a rest day, never a sale.
    public int maxProfit(int[] prices) {
        int hold = -prices[0], sold = 0, rest = 0;
        for (int i = 1; i < prices.length; i++) {
            int p = prices[i];
            int nextHold = Math.max(hold, rest - p);
            int nextSold = hold + p;
            rest = Math.max(rest, sold);
            hold = nextHold;
            sold = nextSold;
        }
        return Math.max(sold, rest);
    }
}
