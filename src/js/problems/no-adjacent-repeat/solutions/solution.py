def reorganize_string(s: str) -> str:
    # O(26 * n) time - greedy left to right. With m letters still to place, a letter occurring
    # more than m // 2 times must go next; otherwise the smallest letter that differs from the
    # previous one keeps the rest arrangeable.
    cnt = [0] * 26
    for ch in s:
        cnt[ord(ch) - 97] += 1
    n = len(s)
    # Beyond ceil(n / 2) copies, two of them must touch.
    if max(cnt) > (n + 1) // 2:
        return ""
    # Letters still available, ascending, so the two smallest candidates are always at the front.
    present = [c for c in range(26) if cnt[c]]
    out = []
    prev = -1
    for m in range(n, 0, -1):
        top = max(cnt)
        if 2 * top > m:
            pick = cnt.index(top)
        else:
            pick = present[0] if present[0] != prev else present[1]
        cnt[pick] -= 1
        if cnt[pick] == 0:
            present.remove(pick)
        out.append(chr(97 + pick))
        prev = pick
    return "".join(out)
