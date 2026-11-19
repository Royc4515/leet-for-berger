# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0392.Is%20Subsequence/Solution.py
def is_subsequence(s: str, t: str) -> bool:
    # O(|s| + |t|) time, O(1) space. Matching each letter of s at its earliest spot in t
    # leaves the most room for the rest, so the greedy scan never needs to backtrack.
    i = j = 0
    while i < len(s) and j < len(t):
        if s[i] == t[j]:
            i += 1
        j += 1
    return i == len(s)
