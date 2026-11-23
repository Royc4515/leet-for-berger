def is_power_of_two(n: int) -> bool:
    # O(1) time - a power of two has exactly one set bit, and n & (n - 1) clears the lowest one.
    # n > 0 rejects zero and every negative number, including -2^31, whose only bit is the sign bit.
    return n > 0 and n & (n - 1) == 0
