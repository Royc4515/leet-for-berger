// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0127.Word%20Ladder/Solution.cs
public class Solution {
    // O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
    // letter at every position and checking the set, never from comparing all pairs of words.
    public int LadderLength(string beginWord, string endWord, string[] wordList) {
        var words = new HashSet<string>(wordList);
        if (!words.Contains(endWord)) {
            return 0;
        }
        // Removing a word when it is queued doubles as the visited mark.
        words.Remove(beginWord);
        var q = new Queue<string>();
        q.Enqueue(beginWord);
        int ans = 1;
        while (q.Count > 0) {
            ++ans;
            for (int i = q.Count; i > 0; --i) {
                var chars = q.Dequeue().ToCharArray();
                for (int j = 0; j < chars.Length; ++j) {
                    char ch = chars[j];
                    for (char k = 'a'; k <= 'z'; ++k) {
                        chars[j] = k;
                        var t = new string(chars);
                        if (!words.Contains(t)) {
                            continue;
                        }
                        if (t == endWord) {
                            return ans;
                        }
                        q.Enqueue(t);
                        words.Remove(t);
                    }
                    chars[j] = ch;
                }
            }
        }
        return 0;
    }
}
