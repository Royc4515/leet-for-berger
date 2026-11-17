# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0875.Koko%20Eating%20Bananas/Solution.py
def min_eating_speed(piles: list[int], h: int) -> int:
    # O(n log(max pile)) time - hours only fall as speed rises, so binary search the speed.
    def fast_enough(k: int) -> bool:
        # Ceiling division without floats: (x + k - 1) // k.
        return sum((x + k - 1) // k for x in piles) <= h

    # Speed max(piles) finishes every pile in one hour, and h >= len(piles), so it always works.
    l, r = 1, max(piles)
    while l < r:
        mid = (l + r) >> 1
        if fast_enough(mid):
            r = mid
        else:
            l = mid + 1
    return l
