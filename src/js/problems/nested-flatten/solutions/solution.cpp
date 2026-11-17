// O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
// item is visited once over the whole run.
class NestedIterator {
public:
    NestedIterator(vector<NestedInteger> nestedList) : root(move(nestedList)) {
        stack.push_back({&root, 0});
    }

    int next() {
        hasNext();
        auto& frame = stack.back();
        return (*frame.first)[frame.second++].getInteger();
    }

    // Settles on the next integer without consuming it, so calling this twice changes nothing.
    bool hasNext() {
        while (!stack.empty()) {
            auto& frame = stack.back();
            const vector<NestedInteger>& items = *frame.first;
            if (frame.second == items.size()) {
                stack.pop_back();
                continue;
            }
            const NestedInteger& item = items[frame.second];
            if (item.isInteger()) return true;
            frame.second++;
            stack.push_back({&item.getList(), 0});
        }
        return false;
    }

private:
    vector<NestedInteger> root;
    // Each frame is a list and the index of its next unread item.
    vector<pair<const vector<NestedInteger>*, size_t>> stack;
};
