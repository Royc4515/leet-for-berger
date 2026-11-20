class Solution {
    // O(n) time. Lower the earliest letter that is not 'a'; if the whole first half is 'a', raise
    // the last letter to 'b' instead.
    public String crackPalindrome(String palindrome) {
        int n = palindrome.length();
        if (n < 2) return "";
        char[] c = palindrome.toCharArray();
        // Only the first half: the middle of an odd palindrome mirrors itself, so lowering it keeps
        // the string a palindrome ("aba" -> "aaa").
        for (int i = 0; i < n / 2; i++) {
            if (c[i] != 'a') {
                c[i] = 'a';
                return new String(c);
            }
        }
        c[n - 1] = 'b';
        return new String(c);
    }
}
