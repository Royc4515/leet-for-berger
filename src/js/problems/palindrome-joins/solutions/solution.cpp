// Adapted from walkccc/LeetCode (MIT): https://github.com/walkccc/LeetCode/blob/HEAD/solutions/336.%20Palindrome%20Pairs/336.cpp
class Solution {
public:
    // O(n * k^2): split every word w = l + r at every position. If r is a palindrome, the partner
    // on the right must be exactly reverse(l); if l is a palindrome, the partner on the left must
    // be exactly reverse(r). Indexing the words by their reverse finds either in O(k).
    vector<vector<int>> palindromeJoins(vector<string>& words) {
        vector<vector<int>> ans;
        unordered_map<string, int> byReverse;  // reversed word -> its index

        for (int i = 0; i < (int)words.size(); ++i) {
            string word = words[i];
            reverse(word.begin(), word.end());
            byReverse[word] = i;
        }

        for (int i = 0; i < (int)words.size(); ++i) {
            const string& word = words[i];
            // The empty word joins every palindrome on its right; handled once here so the split
            // loop below can start at 1 and never report an equal-length pair twice.
            if (const auto it = byReverse.find(""); it != byReverse.end() && it->second != i && isPalindrome(word))
                ans.push_back({i, it->second});
            for (int j = 1; j <= (int)word.length(); ++j) {
                const string l = word.substr(0, j);
                const string r = word.substr(j);
                if (const auto it = byReverse.find(l); it != byReverse.end() && it->second != i && isPalindrome(r))
                    ans.push_back({i, it->second});
                if (const auto it = byReverse.find(r); it != byReverse.end() && it->second != i && isPalindrome(l))
                    ans.push_back({it->second, i});
            }
        }

        sort(ans.begin(), ans.end());
        return ans;
    }

private:
    bool isPalindrome(const string& word) {
        int l = 0;
        int r = (int)word.length() - 1;
        while (l < r)
            if (word[l++] != word[r--]) return false;
        return true;
    }
};
