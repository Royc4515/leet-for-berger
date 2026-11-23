public class Solution {
    // O(n + k log n) time - halving the current largest pile always removes the most stones.
    public int MinStoneSum(int[] piles, int k) {
        // PriorityQueue is a min-heap: the negated pile size makes the largest pile come out first.
        var heap = new PriorityQueue<int, int>();
        int total = 0;
        foreach (int p in piles) {
            heap.Enqueue(p, -p);
            total += p;
        }
        for (int op = 0; op < k; op++) {
            int largest = heap.Dequeue();
            // floor(p / 2) stones go; the smaller pile goes back and may still be the largest.
            total -= largest / 2;
            int rest = largest - largest / 2;
            heap.Enqueue(rest, -rest);
        }
        return total;
    }
}
