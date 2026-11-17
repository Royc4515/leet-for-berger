# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0127.Word%20Ladder/Solution.py
from collections import deque

LETTERS = 'abcdefghijklmnopqrstuvwxyz'


def ladder_length(begin_word: str, end_word: str, word_list: list[str]) -> int:
    # O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
    # letter at every position and checking the set, never from comparing all pairs of words.
    words = set(word_list)
    if end_word not in words:
        return 0
    # Removing a word when it is queued doubles as the visited mark.
    words.discard(begin_word)
    q = deque([begin_word])
    ans = 1
    while q:
        ans += 1
        for _ in range(len(q)):
            s = q.popleft()
            for i in range(len(s)):
                # Slicing once per position is cheaper than rebuilding the word per letter.
                head, tail = s[:i], s[i + 1:]
                for c in LETTERS:
                    t = head + c + tail
                    if t not in words:
                        continue
                    if t == end_word:
                        return ans
                    q.append(t)
                    words.remove(t)
    return 0
