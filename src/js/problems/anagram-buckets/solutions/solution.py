def group_anagrams(words: list[str]) -> list[list[str]]:
    # O(n * k log k) time - the sorted letters are the same key for every anagram.
    # dicts keep insertion order, which gives first-appearance group order for free.
    groups = {}
    for w in words:
        groups.setdefault("".join(sorted(w)), []).append(w)
    return list(groups.values())
