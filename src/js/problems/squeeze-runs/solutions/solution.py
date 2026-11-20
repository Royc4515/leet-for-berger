def squeeze_runs(s: str) -> str:
    # O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the
    # last run needs no separate flush.
    out = []
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        out.append(s[i])
        # A length of 1 is left implicit; str() writes 10 or more as several digits.
        if j - i > 1:
            out.append(str(j - i))
        i = j
    # Joining a list once avoids copying the growing string for every run.
    return "".join(out)
