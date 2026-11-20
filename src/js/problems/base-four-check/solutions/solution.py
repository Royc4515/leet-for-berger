def is_power_of_four(n: int) -> bool:
    # O(1) time - a power of four has exactly one set bit, and that bit sits at an even position.
    # n > 0 rejects zero and negatives; n & (n - 1) == 0 means one bit only;
    # 0x55555555 keeps bits 0, 2, 4, ... so powers of two like 2 and 8 fail the last test.
    return n > 0 and n & (n - 1) == 0 and n & 0x55555555 != 0
