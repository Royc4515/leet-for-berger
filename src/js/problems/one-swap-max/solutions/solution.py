# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0670.Maximum%20Swap/Solution.py
def maximum_swap(num: int) -> int:
    # O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
    s = list(str(num))
    n = len(s)
    # d[i] = index of the largest digit in s[i:], the rightmost one on ties.
    d = list(range(n))
    for i in range(n - 2, -1, -1):
        # '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
        if s[i] <= s[d[i + 1]]:
            d[i] = d[i + 1]
    for i, j in enumerate(d):
        if s[i] < s[j]:
            s[i], s[j] = s[j], s[i]
            break
    return int(''.join(s))
