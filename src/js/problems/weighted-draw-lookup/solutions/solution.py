from bisect import bisect_right
from itertools import accumulate


def weighted_draw_lookup(weights: list[int], draws: list[int]) -> list[int]:
    # O(n + q log n) time: prefix sums once, then one binary search per draw.
    prefix = list(accumulate(weights))
    # Index i owns [prefix[i - 1], prefix[i]), so the answer is the first prefix strictly above d,
    # which is exactly bisect_right (bisect_left would misplace a draw equal to a prefix).
    return [bisect_right(prefix, d) for d in draws]
