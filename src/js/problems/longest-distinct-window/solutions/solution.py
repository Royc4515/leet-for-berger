# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0003.Longest%20Substring%20Without%20Repeating%20Characters/Solution.py
def length_of_longest_substring(s: str) -> int:
    # O(n) time - each character enters the window once and leaves it at most once.
    cnt = {}
    ans = l = 0
    for r, c in enumerate(s):
        cnt[c] = cnt.get(c, 0) + 1
        # Shrink from the left until the new character is no longer duplicated.
        while cnt[c] > 1:
            cnt[s[l]] -= 1
            l += 1
        ans = max(ans, r - l + 1)
    return ans
