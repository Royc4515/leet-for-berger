def longest_increasing_path(matrix: list[list[int]]) -> int:
    # O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
    # strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
    m, n = len(matrix), len(matrix[0])
    flat = [v for row in matrix for v in row]
    order = sorted(range(m * n), key=flat.__getitem__, reverse=True)
    best = [0] * (m * n)
    answer = 0
    for c in order:
        v = flat[c]
        j = c % n
        length = 1
        # Neighbors in the flattened grid: up, down, and left or right within the same row.
        if c >= n and flat[c - n] > v and best[c - n] >= length:
            length = best[c - n] + 1
        if c + n < m * n and flat[c + n] > v and best[c + n] >= length:
            length = best[c + n] + 1
        if j > 0 and flat[c - 1] > v and best[c - 1] >= length:
            length = best[c - 1] + 1
        if j < n - 1 and flat[c + 1] > v and best[c + 1] >= length:
            length = best[c + 1] + 1
        best[c] = length
        if length > answer:
            answer = length
    return answer
