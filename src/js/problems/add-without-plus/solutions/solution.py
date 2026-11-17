MASK = 0xFFFFFFFF
INT_MAX = 0x7FFFFFFF


def get_sum(a: int, b: int) -> int:
    # O(32) - XOR adds without carrying, AND << 1 is the carry; repeat until no carry is left.
    # Python ints never overflow, so a negative carry would grow forever; masking to 32 bits
    # makes it fall off the top the way hardware does.
    a &= MASK
    b &= MASK
    while b:
        a, b = (a ^ b) & MASK, ((a & b) << 1) & MASK
    # Bit 31 set means a negative 32-bit value: flip the low 32 bits back, then invert all bits.
    return a if a <= INT_MAX else ~(a ^ MASK)
