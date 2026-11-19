// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0392.Is%20Subsequence/Solution.c
// O(|s| + |t|) time, O(1) space. Matching each letter of s at its earliest spot in t
// leaves the most room for the rest, so the greedy scan never needs to backtrack.
bool isSubsequence(char* s, char* t) {
    int i = 0;
    // Walking to the terminators avoids two strlen passes over 10^5 characters.
    for (int j = 0; s[i] && t[j]; j++) {
        if (s[i] == t[j]) i++;
    }
    return s[i] == '\0';
}
