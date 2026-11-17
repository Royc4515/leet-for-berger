// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1400-1499/1456.Maximum%20Number%20of%20Vowels%20in%20a%20Substring%20of%20Given%20Length/Solution.java
class Solution {
    // O(n) time - sliding the window adds one character and drops one, so the count updates in O(1).
    public int maxVowels(String s, int k) {
        int cnt = 0;
        for (int i = 0; i < k; ++i) {
            if (isVowel(s.charAt(i))) ++cnt;
        }
        int ans = cnt;
        for (int i = k; i < s.length(); ++i) {
            if (isVowel(s.charAt(i))) ++cnt;
            if (isVowel(s.charAt(i - k))) --cnt;
            ans = Math.max(ans, cnt);
        }
        return ans;
    }

    private boolean isVowel(char c) {
        return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }
}
