public class Solution {
    // O(n) time, O(1) space: one scan, and the magnitude stops growing once it passes 2^31.
    public int TextToInt(string s) {
        int n = s.Length;
        int i = 0;
        while (i < n && s[i] == ' ') {
            i++;
        }
        int sign = 1;
        if (i < n && (s[i] == '+' || s[i] == '-')) {
            if (s[i] == '-') {
                sign = -1;
            }
            i++;
        }
        // A long holds any value up to 2^31 times 10 plus a digit, so the check can come after.
        long magnitude = 0;
        while (i < n && s[i] >= '0' && s[i] <= '9') {
            magnitude = magnitude * 10 + (s[i] - '0');
            // Digits only make it larger, so the answer is already a bound: stop reading.
            if (magnitude > 2147483648L) {
                break;
            }
            i++;
        }
        long value = sign * magnitude;
        if (value > int.MaxValue) {
            return int.MaxValue;
        }
        if (value < int.MinValue) {
            return int.MinValue;
        }
        return (int)value;
    }
}
