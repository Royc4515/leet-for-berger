import java.util.*;

class Solution {
    // O(n log n) time, O(n) space: a max-heap hands over the heaviest stone and accepts the difference.
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int w : stones) {
            heap.add(w);
        }
        while (heap.size() > 1) {
            int first = heap.poll();
            int second = heap.poll();
            // Equal stones vanish; otherwise the difference goes back into the pile.
            if (first != second) {
                heap.add(first - second);
            }
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}
