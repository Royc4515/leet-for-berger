class Solution {
public:
    // O(n) time - two independent checks build the label, so a multiple of both gets both words.
    vector<string> fizzBuzzList(int n) {
        vector<string> out;
        out.reserve(n);
        for (int i = 1; i <= n; i++) {
            string label;
            if (i % 3 == 0) label += "Fizz";
            if (i % 5 == 0) label += "Buzz";
            out.push_back(label.empty() ? to_string(i) : label);
        }
        return out;
    }
};
