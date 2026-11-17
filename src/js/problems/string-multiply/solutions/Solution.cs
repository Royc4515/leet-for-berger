public class Solution {
    // O(m * n) time - long multiplication, digit by digit; no System.Numerics.
    public string Multiply(string num1, string num2) {
        if (num1 == "0" || num2 == "0") return "0";
        int m = num1.Length, n = num2.Length;
        // Digit i of num1 times digit j of num2 contributes to position i + j + 1 (0 = most significant).
        int[] pos = new int[m + n];
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
        var sb = new System.Text.StringBuilder(m + n);
        for (int k = pos[0] == 0 ? 1 : 0; k < m + n; k++) sb.Append((char)('0' + pos[k]));
        return sb.ToString();
    }
}
