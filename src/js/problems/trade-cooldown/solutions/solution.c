static int maxInt(int a, int b) { return a > b ? a : b; }

// O(n) time, O(1) space. Three states at the end of each day: holding a share, having sold
// today, or resting with no share. A buy may only follow a rest day, never a sale.
int maxProfit(int* prices, int pricesSize) {
    int hold = -prices[0], sold = 0, rest = 0;
    for (int i = 1; i < pricesSize; i++) {
        int p = prices[i];
        int nextHold = maxInt(hold, rest - p);
        int nextSold = hold + p;
        rest = maxInt(rest, sold);
        hold = nextHold;
        sold = nextSold;
    }
    return maxInt(sold, rest);
}
