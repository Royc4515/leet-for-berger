class Solution {
    // O(26 * n) time - greedy left to right. With m letters still to place, a letter occurring
    // more than m / 2 times must go next; otherwise the smallest letter that differs from the
    // previous one keeps the rest arrangeable.
    public String reorganizeString(String s) {
        int n = s.length();
        int[] cnt = new int[26];
        int max = 0;
        for (int i = 0; i < n; i++) max = Math.max(max, ++cnt[s.charAt(i) - 'a']);
        // Beyond ceil(n / 2) copies, two of them must touch.
        if (max > (n + 1) / 2) return "";
        StringBuilder out = new StringBuilder(n);
        int prev = -1;
        for (int m = n; m > 0; m--) {
            int pick = -1;
            // At most one letter can exceed half of what is left, so the first hit is the only one.
            for (int c = 0; c < 26 && pick < 0; c++) if (2 * cnt[c] > m) pick = c;
            for (int c = 0; c < 26 && pick < 0; c++) if (cnt[c] > 0 && c != prev) pick = c;
            cnt[pick]--;
            out.append((char) ('a' + pick));
            prev = pick;
        }
        return out.toString();
    }
}
