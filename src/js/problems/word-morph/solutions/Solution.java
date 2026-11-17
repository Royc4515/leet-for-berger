// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0127.Word%20Ladder/Solution.java
import java.util.*;

class Solution {
    // O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
    // letter at every position and checking the set, never from comparing all pairs of words.
    public int ladderLength(String beginWord, String endWord, String[] wordList) {
        Set<String> words = new HashSet<>(Arrays.asList(wordList));
        if (!words.contains(endWord)) {
            return 0;
        }
        // Removing a word when it is queued doubles as the visited mark.
        words.remove(beginWord);
        Queue<String> q = new ArrayDeque<>();
        q.offer(beginWord);
        int ans = 1;
        while (!q.isEmpty()) {
            ++ans;
            for (int i = q.size(); i > 0; --i) {
                char[] chars = q.poll().toCharArray();
                for (int j = 0; j < chars.length; ++j) {
                    char ch = chars[j];
                    for (char k = 'a'; k <= 'z'; ++k) {
                        chars[j] = k;
                        String t = new String(chars);
                        if (!words.contains(t)) {
                            continue;
                        }
                        if (endWord.equals(t)) {
                            return ans;
                        }
                        q.offer(t);
                        words.remove(t);
                    }
                    chars[j] = ch;
                }
            }
        }
        return 0;
    }
}
