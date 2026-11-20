def flip_word_order(s: str) -> str:
    # O(n) time: walk from the right end so the words come out already in reverse order. Skipping
    # every space before a word drops leading, trailing and repeated spaces in one move.
    words = []
    i = len(s) - 1
    while i >= 0:
        while i >= 0 and s[i] == ' ':
            i -= 1
        if i < 0:
            break
        end = i
        while i >= 0 and s[i] != ' ':
            i -= 1
        words.append(s[i + 1:end + 1])
    # One join at the end: the output is built once instead of copied per word.
    return ' '.join(words)
