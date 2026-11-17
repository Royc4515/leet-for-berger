class NumMatrix:
    # O(rows * cols) to build, O(1) per query: a 2D prefix table plus inclusion-exclusion.

    def __init__(self, matrix: list[list[int]]):
        rows, cols = len(matrix), len(matrix[0])
        # An extra row and column of zeros, so rectangles touching row 0 or column 0 need no special case.
        p = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(rows):
            for c in range(cols):
                # The block above and the block to the left overlap in p[r][c], counted twice.
                p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c]
        self.p = p

    def sum_region(self, row1: int, col1: int, row2: int, col2: int) -> int:
        p = self.p
        # Remove the strip above and the strip to the left, then add back their shared corner.
        return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1]
