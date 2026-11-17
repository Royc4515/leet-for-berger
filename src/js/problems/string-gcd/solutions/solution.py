from math import gcd


def gcd_of_strings(str1: str, str2: str) -> str:
    # O(m + n) time. If both strings repeat the same x, gluing them in either order gives the same
    # string; if they do not, some position disagrees.
    if str1 + str2 != str2 + str1:
        return ""
    # Any common divisor's length divides both lengths, and the gcd-length prefix is one of them.
    return str1[: gcd(len(str1), len(str2))]
