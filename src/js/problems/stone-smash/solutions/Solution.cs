public class Solution {
    // O(n log n) time, O(n) space: a heap hands over the heaviest stone and accepts the difference.
    public int LastStoneWeight(int[] stones) {
        // PriorityQueue dequeues the smallest priority first, so the priority is the negated weight
        // (weights are at most 10^9, so negating cannot overflow).
        var heap = new PriorityQueue<int, int>();
        foreach (int w in stones) {
            heap.Enqueue(w, -w);
        }
        while (heap.Count > 1) {
            int first = heap.Dequeue();
            int second = heap.Dequeue();
            // Equal stones vanish; otherwise the difference goes back into the pile.
            if (first != second) {
                int diff = first - second;
                heap.Enqueue(diff, -diff);
            }
        }
        return heap.Count == 0 ? 0 : heap.Peek();
    }
}
