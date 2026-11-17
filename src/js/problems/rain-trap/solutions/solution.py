def trap_rain(heights: list[int]) -> int:
    # O(n) time, O(1) space - two pointers that always move the side with the lower wall.
    lo, hi = 0, len(heights) - 1
    left_max = right_max = water = 0
    while lo < hi:
        # The lower end is bounded by its own side's maximum: the other side is at least as tall.
        if heights[lo] <= heights[hi]:
            left_max = max(left_max, heights[lo])
            water += left_max - heights[lo]
            lo += 1
        else:
            right_max = max(right_max, heights[hi])
            water += right_max - heights[hi]
            hi -= 1
    return water
