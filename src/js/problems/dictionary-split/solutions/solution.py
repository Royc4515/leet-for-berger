def can_split(text: str, words: list[str]) -> bool:
    # O(n * L) hash lookups for text length n and longest word L: reach[i] says the first i
    # characters split cleanly, and the last word of any valid split leaves a shorter valid prefix.
    dictionary = set(words)
    lengths = sorted({len(w) for w in words})
    n = len(text)
    reach = [False] * (n + 1)
    reach[0] = True
    for i in range(1, n + 1):
        for length in lengths:
            if length > i:
                break
            if reach[i - length] and text[i - length:i] in dictionary:
                reach[i] = True
                break
    return reach[n]
