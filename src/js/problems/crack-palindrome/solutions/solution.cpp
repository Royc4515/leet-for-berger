class Solution {
public:
    // O(n) time. Lower the earliest letter that is not 'a'; if the whole first half is 'a', raise
    // the last letter to 'b' instead.
    string crackPalindrome(string palindrome) {
        int n = (int)palindrome.size();
        if (n < 2) return "";
        // Only the first half: the middle of an odd palindrome mirrors itself, so lowering it keeps
        // the string a palindrome ("aba" -> "aaa").
        for (int i = 0; i < n / 2; i++) {
            if (palindrome[i] != 'a') {
                palindrome[i] = 'a';
                return palindrome;
            }
        }
        palindrome[n - 1] = 'b';
        return palindrome;
    }
};
