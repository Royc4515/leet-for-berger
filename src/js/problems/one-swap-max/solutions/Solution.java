// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0670.Maximum%20Swap/Solution.java
class Solution {
    // O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
    public int maximumSwap(int num) {
        char[] s = String.valueOf(num).toCharArray();
        int n = s.length;
        // d[i] = index of the largest digit in s[i..], the rightmost one on ties.
        int[] d = new int[n];
        for (int i = 0; i < n; ++i) {
            d[i] = i;
        }
        for (int i = n - 2; i >= 0; --i) {
            // '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
            if (s[i] <= s[d[i + 1]]) {
                d[i] = d[i + 1];
            }
        }
        for (int i = 0; i < n; ++i) {
            int j = d[i];
            if (s[i] < s[j]) {
                char t = s[i];
                s[i] = s[j];
                s[j] = t;
                break;
            }
        }
        // num <= 10^8 has at most 9 digits, so any rearrangement still fits in an int.
        return Integer.parseInt(String.valueOf(s));
    }
}
