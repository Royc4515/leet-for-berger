class Solution {
public:
    // O(n log n) time, O(n) space: a max-heap hands over the heaviest stone and accepts the difference.
    int lastStoneWeight(vector<int>& stones) {
        // priority_queue is a max-heap by default.
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int first = heap.top();
            heap.pop();
            int second = heap.top();
            heap.pop();
            // Equal stones vanish; otherwise the difference goes back into the pile.
            if (first != second) {
                heap.push(first - second);
            }
        }
        return heap.empty() ? 0 : heap.top();
    }
};
