def subarray_sum(nums: list[int], k: int) -> int:
    # O(n) time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k.
    # Seeding prefix 0 once counts subarrays that start at index 0.
    seen = {0: 1}
    prefix = 0
    count = 0
    for v in nums:
        prefix += v
        # Look up before inserting, so the empty subarray (i == j) is never counted.
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
