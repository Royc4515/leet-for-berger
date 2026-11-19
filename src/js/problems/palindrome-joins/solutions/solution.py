# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0336.Palindrome%20Pairs/Solution.py
def palindrome_joins(words: list[str]) -> list[list[int]]:
    # O(n * k^2): split every word w = a + b at every position. If b is a palindrome, the partner
    # on the right must be exactly reverse(a); if a is a palindrome, the partner on the left must
    # be exactly reverse(b). A dict from word to index finds either in O(k).
    d = {w: i for i, w in enumerate(words)}
    ans = []
    for i, w in enumerate(words):
        for j in range(len(w) + 1):
            a, b = w[:j], w[j:]
            ra, rb = a[::-1], b[::-1]
            if ra in d and d[ra] != i and b == rb:
                ans.append([i, d[ra]])
            # j > 0: an empty a would find the same equal-length mirror pair a second time.
            if j and rb in d and d[rb] != i and a == ra:
                ans.append([d[rb], i])
    ans.sort()
    return ans
