# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0076.Minimum%20Window%20Substring/Solution.py
def min_window(s: str, t: str) -> str:
    # O(m + n) time - grow right until t is covered, then shrink left while it stays covered.
    need = [0] * 128
    window = [0] * 128
    for c in t:
        need[ord(c)] += 1
    # cnt counts window characters that fill a still-needed slot of t; cnt == len(t) means covered.
    cnt = l = 0
    k, mi = -1, len(s) + 1
    for r, ch in enumerate(s):
        c = ord(ch)
        window[c] += 1
        if window[c] <= need[c]:
            cnt += 1
        while cnt == len(t):
            # Strictly shorter only: the first window of the minimum length is the leftmost.
            if r - l + 1 < mi:
                mi = r - l + 1
                k = l
            d = ord(s[l])
            if window[d] <= need[d]:
                cnt -= 1
            window[d] -= 1
            l += 1
    return "" if k < 0 else s[k : k + mi]
