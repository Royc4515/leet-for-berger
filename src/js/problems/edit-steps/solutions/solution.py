# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0072.Edit%20Distance/Solution.py
def min_distance(word1: str, word2: str) -> int:
    # O(m * n) time, O(n) space. prev[j] is the distance between the current prefix of word1
    # minus its last letter and the first j letters of word2; only one previous row is needed.
    n = len(word2)
    prev = list(range(n + 1))
    for i, a in enumerate(word1, 1):
        cur = [i] + [0] * n
        for j, b in enumerate(word2, 1):
            if a == b:
                cur[j] = prev[j - 1]
            else:
                # Replace, delete from word1, insert into word1.
                cur[j] = min(prev[j - 1], prev[j], cur[j - 1]) + 1
        prev = cur
    return prev[n]
