def longest_chain(words: list[str]) -> int:
    # O(n * L^2) time, O(n * L) space. Short words first, so every predecessor (one letter
    # shorter) already holds its final chain length when a word looks it up.
    best = {}
    answer = 0
    for w in sorted(words, key=len):
        # Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
        here = 1
        for i in range(len(w)):
            here = max(here, best.get(w[:i] + w[i + 1:], 0) + 1)
        best[w] = here
        answer = max(answer, here)
    return answer
