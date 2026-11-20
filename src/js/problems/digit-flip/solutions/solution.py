def flip_digits(x: int) -> int:
    # O(log x) time: peel the last digit and append it to the result, once per digit.
    sign = -1 if x < 0 else 1
    rest = abs(x)
    flipped = 0
    while rest > 0:
        flipped = flipped * 10 + rest % 10
        rest //= 10
    flipped *= sign
    # Python ints never overflow, so the 32-bit limit has to be checked by hand, on both sides.
    if flipped < -2**31 or flipped > 2**31 - 1:
        return 0
    return flipped
