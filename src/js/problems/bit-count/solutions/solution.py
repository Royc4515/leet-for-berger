def hamming_weight(n: int) -> int:
    # O(number of 1 bits) - n & (n - 1) clears the lowest set bit, so the loop runs once per 1
    # instead of once per bit position.
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count
