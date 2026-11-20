class Solution {
    // O(n) time, O(1) space: one scan, and the magnitude stops growing once it passes 2^31.
    public int textToInt(String s) {
        int n = s.length();
        int i = 0;
        while (i < n && s.charAt(i) == ' ') {
            i++;
        }
        int sign = 1;
        if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
            if (s.charAt(i) == '-') {
                sign = -1;
            }
            i++;
        }
        // A long holds any value up to 2^31 times 10 plus a digit, so the check can come after.
        long magnitude = 0;
        while (i < n && s.charAt(i) >= '0' && s.charAt(i) <= '9') {
            magnitude = magnitude * 10 + (s.charAt(i) - '0');
            // Digits only make it larger, so the answer is already a bound: stop reading.
            if (magnitude > 2147483648L) {
                break;
            }
            i++;
        }
        long value = sign * magnitude;
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) value;
    }
}
