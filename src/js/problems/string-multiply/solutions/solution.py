def multiply(num1: str, num2: str) -> str:
    # O(m * n) time - long multiplication. Python ints are arbitrary precision, but the point is
    # to do what a fixed-width language must: work digit by digit.
    if num1 == "0" or num2 == "0":
        return "0"
    m, n = len(num1), len(num2)
    a = [ord(c) - 48 for c in num1]
    b = [ord(c) - 48 for c in num2]
    # Digit i of num1 times digit j of num2 contributes to position i + j + 1 (0 = most significant).
    pos = [0] * (m + n)
    for i in range(m - 1, -1, -1):
        da = a[i]
        carry = 0
        for j in range(n - 1, -1, -1):
            total = pos[i + j + 1] + da * b[j] + carry
            pos[i + j + 1] = total % 10
            carry = total // 10
        # Everything right of position i has been settled; the leftover carry lands at i.
        pos[i] += carry
    # The product has m + n or m + n - 1 digits; only the first one can be a zero.
    start = 1 if pos[0] == 0 else 0
    return "".join(map(str, pos[start:]))
