// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0336.Palindrome%20Pairs/Solution.cs
public class Solution {
    // O(n * k^2): split every word w = prefix + suffix at every position. If the suffix is a
    // palindrome, the partner on the right must be exactly reverse(prefix); if the prefix is a
    // palindrome, the partner on the left must be exactly reverse(suffix). Indexing the words by
    // their reverse finds either in O(k).
    public int[][] PalindromeJoins(string[] words) {
        var results = new List<int[]>();
        var reverseDict = new Dictionary<string, int>();
        for (var i = 0; i < words.Length; ++i) {
            var chars = words[i].ToCharArray();
            Array.Reverse(chars);
            reverseDict[new string(chars)] = i;
        }

        for (var i = 0; i < words.Length; ++i) {
            var word = words[i];
            for (var j = 0; j <= word.Length; ++j) {
                // j > 0: an empty prefix would find the same equal-length mirror pair a second time.
                if (j > 0 && IsPalindrome(word, 0, j - 1)
                    && reverseDict.TryGetValue(word.Substring(j), out var left) && left != i) {
                    results.Add(new[] { left, i });
                }
                if (IsPalindrome(word, j, word.Length - 1)
                    && reverseDict.TryGetValue(word.Substring(0, j), out var right) && right != i) {
                    results.Add(new[] { i, right });
                }
            }
        }

        results.Sort((x, y) => x[0] != y[0] ? x[0].CompareTo(y[0]) : x[1].CompareTo(y[1]));
        return results.ToArray();
    }

    private static bool IsPalindrome(string word, int startIndex, int endIndex) {
        var i = startIndex;
        var j = endIndex;
        while (i < j) {
            if (word[i] != word[j]) return false;
            ++i;
            --j;
        }
        return true;
    }
}
