// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0362.Design%20Hit%20Counter/Solution.cpp
// O(1) amortized per hit, O(log n) per query: timestamps never decrease, so the vector of hits
// is already sorted and the window start is one binary search away.
class HitCounter {
public:
    HitCounter() {
    }

    void hit(int timestamp) {
        ts.push_back(timestamp);
    }

    int getHits(int timestamp) {
        // The window is (timestamp - 300, timestamp]: its oldest second is timestamp - 299.
        return ts.end() - lower_bound(ts.begin(), ts.end(), timestamp - 300 + 1);
    }

private:
    vector<int> ts;
};
