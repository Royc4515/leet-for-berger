// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0003.Longest%20Substring%20Without%20Repeating%20Characters/Solution.c
// O(n) time - each character enters the window once and leaves it at most once.
int lengthOfLongestSubstring(char* s) {
    // Indexed by unsigned char: a plain char may be signed and index out of bounds.
    int freq[256] = {0};
    int ans = 0;
    int len = strlen(s);
    for (int l = 0, r = 0; r < len; r++) {
        unsigned char c = (unsigned char)s[r];
        freq[c]++;
        // Shrink from the left until the new character is no longer duplicated.
        while (freq[c] > 1) {
            freq[(unsigned char)s[l]]--;
            l++;
        }
        if (ans < r - l + 1) ans = r - l + 1;
    }
    return ans;
}
