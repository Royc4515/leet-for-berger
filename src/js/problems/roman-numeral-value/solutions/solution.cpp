class Solution {
public:
    // O(n) time - each symbol only needs its right neighbour to know its sign.
    int romanToInt(string s) {
        int total = 0;
        for (size_t i = 0; i < s.size(); i++) {
            int v = value(s[i]);
            // A smaller symbol before a larger one is the left half of a subtractive pair (IV, CM).
            if (i + 1 < s.size() && v < value(s[i + 1])) total -= v;
            else total += v;
        }
        return total;
    }

private:
    static int value(char c) {
        switch (c) {
            case 'I': return 1;
            case 'V': return 5;
            case 'X': return 10;
            case 'L': return 50;
            case 'C': return 100;
            case 'D': return 500;
            default: return 1000;
        }
    }
};
