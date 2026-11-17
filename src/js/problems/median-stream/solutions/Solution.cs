// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/Solution.cs
// O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.
public class MedianFinder {
    private readonly PriorityQueue<int, int> high = new PriorityQueue<int, int>();
    private readonly PriorityQueue<int, int> low = new PriorityQueue<int, int>(Comparer<int>.Create((a, b) => b.CompareTo(a)));

    public MedianFinder() {
    }

    public void AddNum(int num) {
        // Route the number through the smaller half first, so the largest of it moves up and the
        // halves stay ordered whatever value arrives.
        low.Enqueue(num, num);
        int moved = low.Dequeue();
        high.Enqueue(moved, moved);
        // Keep the smaller half the same size or one larger, so its top is the odd-count median.
        if (high.Count > low.Count) {
            int back = high.Dequeue();
            low.Enqueue(back, back);
        }
    }

    public long FindMedian() {
        // Widen before adding: two values near 2^31 - 1 overflow an int sum.
        if (low.Count > high.Count) return 2L * low.Peek();
        return (long)low.Peek() + high.Peek();
    }
}
