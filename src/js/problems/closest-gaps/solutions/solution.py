def minimum_abs_difference(arr: list[int]) -> list[list[int]]:
    # O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
    values = sorted(arr)
    best = min(values[i] - values[i - 1] for i in range(1, len(values)))
    # Scanning left to right yields the pairs already in ascending order.
    return [[values[i - 1], values[i]] for i in range(1, len(values)) if values[i] - values[i - 1] == best]
