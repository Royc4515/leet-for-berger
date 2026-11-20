def mirror_bits(n: int) -> int:
    # O(1): always 32 rounds, so leading zeros of n become trailing zeros of the answer.
    out = 0
    for _ in range(32):
        # Make room on the right of the answer, then take the lowest bit of n.
        out = (out << 1) | (n & 1)
        n >>= 1
    return out
