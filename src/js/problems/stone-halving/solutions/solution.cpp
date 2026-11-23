class Solution {
public:
    // O(n + k log n) time - halving the current largest pile always removes the most stones.
    int minStoneSum(vector<int>& piles, int k) {
        priority_queue<int> heap(piles.begin(), piles.end());
        int total = 0;
        for (int p : piles) total += p;
        for (int op = 0; op < k; op++) {
            int largest = heap.top();
            heap.pop();
            // floor(p / 2) stones go; the smaller pile goes back and may still be the largest.
            total -= largest / 2;
            heap.push(largest - largest / 2);
        }
        return total;
    }
};
