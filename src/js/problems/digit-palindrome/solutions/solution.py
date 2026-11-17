def is_palindrome(x: int) -> bool:
    # O(log10 x) time - reverse only the lower half of the digits, so the reversed part can never
    # outgrow the original (which matters in fixed-width languages, and costs nothing here).
    # A trailing zero would need a leading zero to match; only 0 itself qualifies.
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    half = 0
    while x > half:
        half = half * 10 + x % 10
        x //= 10
    # Odd digit count: the middle digit ended up in half, so drop it before comparing.
    return x == half or x == half // 10
