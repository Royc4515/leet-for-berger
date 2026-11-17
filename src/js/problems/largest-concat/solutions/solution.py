from functools import cmp_to_key


def largest_number(nums: list[int]) -> str:
    # O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
    parts = [str(v) for v in nums]

    def order(a: str, b: str) -> int:
        # a + b and b + a have the same length, so string order is numeric order.
        if a + b > b + a:
            return -1
        return 1 if a + b < b + a else 0

    parts.sort(key=cmp_to_key(order))
    # The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
    return "0" if parts[0] == "0" else "".join(parts)
