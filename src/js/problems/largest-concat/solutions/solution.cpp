class Solution {
public:
    // O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
    string largestNumber(vector<int>& nums) {
        vector<string> parts;
        parts.reserve(nums.size());
        for (int v : nums) parts.push_back(to_string(v));
        // a + b and b + a have the same length, so string order is numeric order. Comparing them
        // as integers would overflow: two 10-digit values make a 20-digit number.
        sort(parts.begin(), parts.end(), [](const string& a, const string& b) { return a + b > b + a; });
        // The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
        if (parts[0] == "0") return "0";
        string out;
        for (const string& p : parts) out += p;
        return out;
    }
};
