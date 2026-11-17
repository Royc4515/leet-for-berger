# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0200.Number%20of%20Islands/Solution.py
def count_islands(grid: list[str]) -> int:
    # O(rows * cols) time - flood fill each new island once. An explicit stack, because one
    # snake-shaped island can be ~45,000 cells deep and Python's recursion limit is 1000.
    m, n = len(grid), len(grid[0])
    seen = [[False] * n for _ in range(m)]
    dirs = (-1, 0, 1, 0, -1)
    ans = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] != '1' or seen[i][j]:
                continue
            ans += 1
            seen[i][j] = True
            stack = [(i, j)]
            while stack:
                r, c = stack.pop()
                for k in range(4):
                    x, y = r + dirs[k], c + dirs[k + 1]
                    # Mark on push, not on pop, so no cell enters the stack twice.
                    if 0 <= x < m and 0 <= y < n and grid[x][y] == '1' and not seen[x][y]:
                        seen[x][y] = True
                        stack.append((x, y))
    return ans
