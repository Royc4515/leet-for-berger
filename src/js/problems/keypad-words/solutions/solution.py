# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0017.Letter%20Combinations%20of%20a%20Phone%20Number/Solution.py
def letter_combinations(digits: str) -> list[str]:
    # O(4^n * n) time - extend every partial string by each letter of the next digit.
    # Without this check the loop would return [""] for no digits.
    if not digits:
        return []
    d = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    ans = [""]
    for i in digits:
        s = d[int(i) - 2]
        # Prefixes outer, letters inner: the result stays in lexicographic order.
        ans = [a + b for a in ans for b in s]
    return ans
