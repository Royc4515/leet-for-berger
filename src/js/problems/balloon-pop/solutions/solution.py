# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0312.Burst%20Balloons/Solution.py
def max_coins(nums: list[int]) -> int:
    # O(n^3) time, O(n^2) space. f[i][j] is the best total for popping every balloon strictly
    # between borders i and j; choosing the one popped LAST makes the two sides independent,
    # because its neighbors at that moment are exactly the borders.
    n = len(nums)
    arr = [1] + nums + [1]
    f = [[0] * (n + 2) for _ in range(n + 2)]
    # col[j][k] mirrors f[k][j], so the inner loop reads two rows instead of a column.
    col = [[0] * (n + 2) for _ in range(n + 2)]
    for i in range(n - 1, -1, -1):
        row = f[i]
        for j in range(i + 2, n + 2):
            c = arr[i] * arr[j]
            best = max([a + b + c * x for a, b, x in zip(row[i + 1 : j], col[j][i + 1 : j], arr[i + 1 : j])])
            row[j] = best
            col[j][i] = best
    return f[0][n + 1]
