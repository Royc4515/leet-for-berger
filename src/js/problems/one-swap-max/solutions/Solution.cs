public class Solution {
    // O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
    public int MaximumSwap(int num) {
        char[] s = num.ToString().ToCharArray();
        int n = s.Length;
        // d[i] = index of the largest digit in s[i..], the rightmost one on ties.
        int[] d = new int[n];
        d[n - 1] = n - 1;
        for (int i = n - 2; i >= 0; --i) {
            // '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
            d[i] = s[i] <= s[d[i + 1]] ? d[i + 1] : i;
        }
        for (int i = 0; i < n; ++i) {
            int j = d[i];
            if (s[i] < s[j]) {
                (s[i], s[j]) = (s[j], s[i]);
                break;
            }
        }
        return int.Parse(new string(s));
    }
}
