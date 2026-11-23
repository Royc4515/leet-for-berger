def largest_square_area(grid: list[list[int]]) -> int:
    # O(rows * cols) time, O(cols) extra space: rolling 1D DP tracking largest square side ending at (r, c).
    cols = len(grid[0])
    dp = [0] * (cols + 1)
    best = 0
    for row in grid:
        prev_diag = 0
        for c in range(cols):
            saved = dp[c + 1]
            if row[c] == 1:
                side = 1 + min(dp[c + 1], dp[c], prev_diag)
                dp[c + 1] = side
                if side > best:
                    best = side
            else:
                dp[c + 1] = 0
            prev_diag = saved
    return best * best
