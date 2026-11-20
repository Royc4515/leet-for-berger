def count_bounded_pairs(nums: list[int], lower: int, upper: int) -> int:
    # O(n log n) time: positions do not matter, so sort a copy and count pairs with a sum of at
    # most x using two pointers. The window [lower, upper] is count(upper) - count(lower - 1).
    a = sorted(nums)

    def at_most(limit: int) -> int:
        count = 0
        lo, hi = 0, len(a) - 1
        while lo < hi:
            if a[lo] + a[hi] <= limit:
                # a[lo] pairs with every index in (lo, hi]: all of them are at most a[hi].
                count += hi - lo
                lo += 1
            else:
                hi -= 1
        return count

    return at_most(upper) - at_most(lower - 1)
