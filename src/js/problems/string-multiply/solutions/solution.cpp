class Solution {
public:
    // O(m * n) time - long multiplication, digit by digit.
    string multiply(string num1, string num2) {
        if (num1 == "0" || num2 == "0") return "0";
        int m = num1.size(), n = num2.size();
        // Digit i of num1 times digit j of num2 contributes to position i + j + 1 (0 = most significant).
        vector<int> pos(m + n, 0);
        for (int i = m - 1; i >= 0; i--) {
            int da = num1[i] - '0';
            int carry = 0;
            for (int j = n - 1; j >= 0; j--) {
                int total = pos[i + j + 1] + da * (num2[j] - '0') + carry;
                pos[i + j + 1] = total % 10;
                carry = total / 10;
            }
            // Everything right of position i has been settled; the leftover carry lands at i.
            pos[i] += carry;
        }
        // The product has m + n or m + n - 1 digits; only the first one can be a zero.
        string out;
        out.reserve(m + n);
        for (int k = pos[0] == 0 ? 1 : 0; k < m + n; k++) out.push_back((char)('0' + pos[k]));
        return out;
    }
};
