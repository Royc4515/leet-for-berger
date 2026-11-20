def text_to_int(s: str) -> int:
    # O(n) time, O(1) space: one scan, and the magnitude stops growing once it passes 2^31.
    n = len(s)
    i = 0
    while i < n and s[i] == ' ':
        i += 1
    sign = 1
    if i < n and s[i] in '+-':
        if s[i] == '-':
            sign = -1
        i += 1
    magnitude = 0
    while i < n and '0' <= s[i] <= '9':
        magnitude = magnitude * 10 + (ord(s[i]) - 48)
        # Digits only make it larger, so the answer is already a bound. Stopping here also keeps
        # a 100,000-digit run from turning into a huge Python integer.
        if magnitude > 2147483648:
            break
        i += 1
    return max(-2147483648, min(2147483647, sign * magnitude))
