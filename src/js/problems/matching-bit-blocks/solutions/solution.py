def count_matching_blocks(s: str) -> int:
    # O(n) time, O(1) space: every counted substring straddles one border between two runs, and
    # that border contributes min(left run, right run).
    prev, cur = 0, 1
    total = 0
    for i in range(1, len(s)):
        if s[i] == s[i - 1]:
            cur += 1
        else:
            total += min(prev, cur)
            prev, cur = cur, 1
    # The last run has no character after it to trigger the update above.
    return total + min(prev, cur)
