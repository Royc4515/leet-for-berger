import java.util.*;

class Solution {
    // O(n + k log n) time - halving the current largest pile always removes the most stones.
    public int minStoneSum(int[] piles, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        int total = 0;
        for (int p : piles) {
            heap.add(p);
            total += p;
        }
        for (int op = 0; op < k; op++) {
            int largest = heap.poll();
            // floor(p / 2) stones go; the smaller pile goes back and may still be the largest.
            total -= largest / 2;
            heap.add(largest - largest / 2);
        }
        return total;
    }
}
