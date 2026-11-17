public class Solution {
    // O(n) time - count what the simulation would do instead of running it.
    public long TimeToBuy(int[] tickets, int k) {
        int target = tickets[k];
        long total = 0; // up to 10^14: a 32-bit int overflows
        for (int i = 0; i < tickets.Length; i++) {
            // Everyone ahead of k gets target turns, everyone behind target - 1; nobody buys extra.
            total += Math.Min(tickets[i], i <= k ? target : target - 1);
        }
        return total;
    }
}
