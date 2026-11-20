def interleave_words(word1: str, word2: str) -> str:
    # O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
    out = []
    common = min(len(word1), len(word2))
    for i in range(common):
        out.append(word1[i])
        out.append(word2[i])
    # Only one of these slices is non-empty. Building a list and joining once avoids
    # copying the growing string on every step.
    out.append(word1[common:])
    out.append(word2[common:])
    return "".join(out)
