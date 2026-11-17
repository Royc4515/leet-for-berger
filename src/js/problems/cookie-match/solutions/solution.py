# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0455.Assign%20Cookies/Solution.py
def find_content_children(g: list[int], s: list[int]) -> int:
    # O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
    g = sorted(g)
    s = sorted(s)
    j = 0
    for i, greed in enumerate(g):
        # Skip cookies that cannot satisfy this child; they cannot satisfy anyone greedier either.
        while j < len(s) and s[j] < greed:
            j += 1
        if j >= len(s):
            return i
        j += 1
    return len(g)
