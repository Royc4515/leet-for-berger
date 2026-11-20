def count_product_below(nums: list[int], k: int) -> int:
    # O(n) time - all values are >= 1, so a longer window never has a smaller product and the
    # leftmost valid start only moves forward.
    # With k <= 1 no product qualifies, and the shrink loop would run past the window.
    if k <= 1:
        return 0
    product = 1
    left = 0
    count = 0
    for right, v in enumerate(nums):
        product *= v
        while product >= k:
            product //= nums[left]
            left += 1
        # Every window that ends at right and starts in [left, right] fits.
        count += right - left + 1
    return count
