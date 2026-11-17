class Solution {
public:
    // O(n) time, O(1) space. Three states at the end of each day: holding a share, having sold
    // today, or resting with no share. A buy may only follow a rest day, never a sale.
    int maxProfit(vector<int>& prices) {
        int hold = -prices[0], sold = 0, rest = 0;
        for (size_t i = 1; i < prices.size(); i++) {
            int p = prices[i];
            int nextHold = max(hold, rest - p);
            int nextSold = hold + p;
            rest = max(rest, sold);
            hold = nextHold;
            sold = nextSold;
        }
        return max(sold, rest);
    }
};
