// O(1) per operation: every entry remembers the minimum of the stack up to and including it.
class MinStack {
    vector<pair<int, int>> st;

public:
    MinStack() {
    }

    void push(int val) {
        // The minimum below an entry never changes while that entry sits on the stack.
        st.push_back({val, st.empty() ? val : min(val, st.back().second)});
    }

    void pop() {
        st.pop_back();
    }

    int top() {
        return st.back().first;
    }

    int getMin() {
        return st.back().second;
    }
};
