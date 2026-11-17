from collections import Counter


def top_k_frequent(nums: list[int], k: int) -> list[int]:
    # O(n + d log d) time - count once, then order the d distinct values by the rule.
    count = Counter(nums)
    ranked = sorted(count, key=lambda v: (-count[v], v))
    return ranked[:k]
