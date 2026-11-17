def smaller_numbers_than_current(nums: list[int]) -> list[int]:
    # O(n + 101) time - values are 0..100, so count them instead of comparing pairs.
    freq = [0] * 101
    for v in nums:
        freq[v] += 1
    # smaller[v] = how many elements are below v: a running total of the counts before v.
    smaller = [0] * 101
    for v in range(1, 101):
        smaller[v] = smaller[v - 1] + freq[v - 1]
    return [smaller[v] for v in nums]
