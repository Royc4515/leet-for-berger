// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/Solution.java
import java.util.*;

// O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.
class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> high = new PriorityQueue<>();

    public MedianFinder() {
    }

    public void addNum(int num) {
        // Route the number through the smaller half first, so the largest of it moves up and the
        // halves stay ordered whatever value arrives.
        low.offer(num);
        high.offer(low.poll());
        // Keep the smaller half the same size or one larger, so its top is the odd-count median.
        if (high.size() > low.size()) low.offer(high.poll());
    }

    public long findMedian() {
        // Widen before adding: two values near 2^31 - 1 overflow an int sum.
        if (low.size() > high.size()) return 2L * low.peek();
        return (long) low.peek() + high.peek();
    }
}
