// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0127.Word%20Ladder/Solution.cpp
class Solution {
public:
    // O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
    // letter at every position and checking the set, never from comparing all pairs of words.
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return 0;
        // Erasing a word when it is queued doubles as the visited mark.
        words.erase(beginWord);
        queue<string> q{{beginWord}};
        int ans = 1;
        while (!q.empty()) {
            ++ans;
            for (int i = q.size(); i > 0; --i) {
                string s = q.front();
                q.pop();
                for (int j = 0; j < (int)s.size(); ++j) {
                    char ch = s[j];
                    for (char k = 'a'; k <= 'z'; ++k) {
                        s[j] = k;
                        if (!words.count(s)) continue;
                        if (s == endWord) return ans;
                        q.push(s);
                        words.erase(s);
                    }
                    s[j] = ch;
                }
            }
        }
        return 0;
    }
};
