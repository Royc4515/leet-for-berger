public class Solution {
    // O(n) time - sliding the window adds one character and drops one, so the count updates in O(1).
    public int MaxVowels(string s, int k) {
        int cnt = 0;
        for (int i = 0; i < k; i++) {
            if (IsVowel(s[i])) cnt++;
        }
        int ans = cnt;
        for (int i = k; i < s.Length; i++) {
            if (IsVowel(s[i])) cnt++;
            if (IsVowel(s[i - k])) cnt--;
            ans = Math.Max(ans, cnt);
        }
        return ans;
    }

    private static bool IsVowel(char c) {
        return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }
}
