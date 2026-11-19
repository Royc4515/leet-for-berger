// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0336.Palindrome%20Pairs/Solution.cs
import java.util.*;

class Solution {
    // O(n * k^2): split every word w = prefix + suffix at every position. If the suffix is a
    // palindrome, the partner on the right must be exactly reverse(prefix); if the prefix is a
    // palindrome, the partner on the left must be exactly reverse(suffix). Indexing the words by
    // their reverse finds either in O(k), without reversing anything per split.
    public int[][] palindromeJoins(String[] words) {
        Map<String, Integer> byReverse = new HashMap<>();
        for (int i = 0; i < words.length; ++i) {
            byReverse.put(new StringBuilder(words[i]).reverse().toString(), i);
        }
        List<int[]> ans = new ArrayList<>();
        for (int i = 0; i < words.length; ++i) {
            String w = words[i];
            int m = w.length();
            for (int j = 0; j <= m; ++j) {
                // j > 0: an empty prefix would find the same equal-length mirror pair a second time.
                if (j > 0 && isPalindrome(w, 0, j - 1)) {
                    Integer left = byReverse.get(w.substring(j));
                    if (left != null && left != i) {
                        ans.add(new int[] {left, i});
                    }
                }
                // The cheap palindrome check runs first: it usually fails within a letter or two.
                if (isPalindrome(w, j, m - 1)) {
                    Integer right = byReverse.get(w.substring(0, j));
                    if (right != null && right != i) {
                        ans.add(new int[] {i, right});
                    }
                }
            }
        }
        ans.sort((x, y) -> x[0] != y[0] ? Integer.compare(x[0], y[0]) : Integer.compare(x[1], y[1]));
        return ans.toArray(new int[0][]);
    }

    private static boolean isPalindrome(String s, int lo, int hi) {
        while (lo < hi) {
            if (s.charAt(lo++) != s.charAt(hi--)) {
                return false;
            }
        }
        return true;
    }
}
