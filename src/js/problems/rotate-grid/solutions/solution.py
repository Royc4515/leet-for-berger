def rotate_grid(matrix: list[list[int]]) -> list[list[int]]:
    # O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
    # mirroring each row, and both moves are plain swaps.
    n = len(matrix)
    for i in range(n):
        # Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
    return matrix
