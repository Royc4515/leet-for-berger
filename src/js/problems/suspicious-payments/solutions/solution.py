# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.py
def suspicious_payments(payments: list[str]) -> list[str]:
    # O(n + sum of g^2) time for name groups of size g, O(n) space.
    by_name = {}
    flagged = [False] * len(payments)
    for i, p in enumerate(payments):
        name, minute, amount, city = p.split(",")
        minute = int(minute)
        if int(amount) > 1000:
            flagged[i] = True
        group = by_name.setdefault(name, [])
        for m, c, j in group:
            if c != city and abs(minute - m) <= 60:
                # A conflict makes both records suspicious, including the one seen earlier.
                flagged[i] = flagged[j] = True
        group.append((minute, city, i))
    # Flags live on positions, so identical copies stay separate and input order is kept.
    return [p for i, p in enumerate(payments) if flagged[i]]
