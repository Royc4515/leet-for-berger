from bisect import bisect_left


def length_of_lis(nums: list[int]) -> int:
    # O(n log n) time - tails[k] is the smallest last value of any increasing run of length k + 1.
    tails: list[int] = []
    for x in nums:
        # bisect_left (first tail >= x), not bisect_right: an equal value must not extend a run.
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            # A smaller ending for the same length can only help later elements.
            tails[i] = x
    return len(tails)
