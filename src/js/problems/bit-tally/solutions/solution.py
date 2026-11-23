def count_bits(n: int) -> list[int]:
    # O(n) time - i >> 1 drops the lowest bit of i, and its count is already in the table.
    tally = [0] * (n + 1)
    for i in range(1, n + 1):
        tally[i] = tally[i >> 1] + (i & 1)
    return tally
