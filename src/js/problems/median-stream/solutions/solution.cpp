// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/Solution.cpp
// O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.
class MedianFinder {
public:
    MedianFinder() {
    }

    void addNum(int num) {
        // Route the number through the smaller half first, so the largest of it moves up and the
        // halves stay ordered whatever value arrives.
        low.push(num);
        high.push(low.top());
        low.pop();
        // Keep the smaller half the same size or one larger, so its top is the odd-count median.
        if (high.size() > low.size()) {
            low.push(high.top());
            high.pop();
        }
    }

    long long findMedian() {
        // Widen before adding: two values near 2^31 - 1 overflow an int sum.
        if (low.size() > high.size()) return 2LL * low.top();
        return (long long)low.top() + high.top();
    }

private:
    priority_queue<int> low;
    priority_queue<int, vector<int>, greater<int>> high;
};
