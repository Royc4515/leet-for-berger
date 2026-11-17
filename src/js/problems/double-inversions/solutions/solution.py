from bisect import bisect_right
from itertools import repeat


def reverse_pairs(nums: list[int]) -> int:
    # O(n log^2 n) with the heavy work in C - merge sort that returns each half sorted. For a
    # right-half value x, the left-half values above 2 * x are the pairs crossing the middle;
    # bisect counts the ones that are not. Python ints never overflow, so 2 * x is exact.
    def sort_count(a: list[int]) -> tuple[list[int], int]:
        n = len(a)
        if n <= 1:
            return a, 0
        mid = n >> 1
        left, cl = sort_count(a[:mid])
        right, cr = sort_count(a[mid:])
        below = sum(map(bisect_right, repeat(left, len(right)), [2 * x for x in right]))
        # sorted() on two sorted runs is a linear merge (Timsort finds the runs).
        return sorted(left + right), cl + cr + len(left) * len(right) - below

    return sort_count(nums)[1]
