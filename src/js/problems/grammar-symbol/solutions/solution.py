def kth_grammar(n: int, k: int) -> int:
    # O(n) time, O(1) space - symbol k of a row comes from symbol ceil(k / 2) of the row above:
    # the same when k is odd, flipped when k is even. Walk the chain to row 1 (which is 0)
    # instead of building rows that reach 2^29 symbols. n only bounds k.
    flips = 0
    while k > 1:
        if k % 2 == 0:
            flips ^= 1
        k = (k + 1) // 2
    return flips
