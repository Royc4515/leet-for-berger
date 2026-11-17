# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0068.Text%20Justification/Solution.py
def justify_text(words: list[str], max_width: int) -> list[str]:
    # O(total output) - greedy packing, then spacing rules per line.
    ans = []
    i, n = 0, len(words)
    while i < n:
        # cnt is the line's width with single gaps; take words while that still fits.
        t = [words[i]]
        cnt = len(words[i])
        i += 1
        while i < n and cnt + 1 + len(words[i]) <= max_width:
            cnt += 1 + len(words[i])
            t.append(words[i])
            i += 1
        # The last line and one-word lines are left-aligned (a one-word line has no gap to widen).
        if i == n or len(t) == 1:
            left = " ".join(t)
            ans.append(left + " " * (max_width - len(left)))
            continue
        gaps = len(t) - 1
        space_width = max_width - (cnt - gaps)
        # Leftmost gaps take the remainder, one extra space each.
        w, m = divmod(space_width, gaps)
        row = []
        for j, s in enumerate(t[:-1]):
            row.append(s)
            row.append(" " * (w + (1 if j < m else 0)))
        row.append(t[-1])
        ans.append("".join(row))
    return ans
