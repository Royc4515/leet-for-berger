def spiral_order(matrix: list[list[int]]) -> list[int]:
    # O(m * n) time - four walls close in; each sweep reads one side of the current layer.
    out = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        out.extend(matrix[top][left:right + 1])
        out.extend(matrix[r][right] for r in range(top + 1, bottom + 1))
        # A lone leftover row or column was already read by the two sweeps above.
        if top < bottom and left < right:
            out.extend(matrix[bottom][c] for c in range(right - 1, left - 1, -1))
            out.extend(matrix[r][left] for r in range(bottom - 1, top, -1))
        top, bottom, left, right = top + 1, bottom - 1, left + 1, right - 1
    return out
