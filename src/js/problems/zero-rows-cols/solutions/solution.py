def set_zeroes(matrix: list[list[int]]) -> list[list[int]]:
    # O(m * n) time, O(1) extra space - the first row and column store which columns and rows
    # to clear; two flags remember whether those marker lines held a zero of their own.
    m, n = len(matrix), len(matrix[0])
    first_row_zero = 0 in matrix[0]
    first_col_zero = any(row[0] == 0 for row in matrix)
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][j] == 0:
                matrix[i][0] = 0
                matrix[0][j] = 0
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][0] == 0 or matrix[0][j] == 0:
                matrix[i][j] = 0
    # Clear the marker lines last, after every other cell has read them.
    if first_row_zero:
        matrix[0] = [0] * n
    if first_col_zero:
        for row in matrix:
            row[0] = 0
    return matrix
