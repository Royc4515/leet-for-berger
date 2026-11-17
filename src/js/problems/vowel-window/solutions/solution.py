# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1400-1499/1456.Maximum%20Number%20of%20Vowels%20in%20a%20Substring%20of%20Given%20Length/Solution.py
def max_vowels(s: str, k: int) -> int:
    # O(n) time - sliding the window adds one character and drops one, so the count updates in O(1).
    vowels = set("aeiou")
    ans = cnt = sum(c in vowels for c in s[:k])
    for i in range(k, len(s)):
        cnt += int(s[i] in vowels) - int(s[i - k] in vowels)
        ans = max(ans, cnt)
    return ans
