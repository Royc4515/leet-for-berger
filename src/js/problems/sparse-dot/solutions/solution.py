def sparse_dot(a: list[list[int]], b: list[list[int]]) -> int:
    # O(a + b) time - both lists are sorted by index, so a merge finds the shared indices.
    i = j = 0
    dot = 0
    while i < len(a) and j < len(b):
        if a[i][0] == b[j][0]:
            dot += a[i][1] * b[j][1]
            i += 1
            j += 1
        # The smaller index can never meet a partner: every later index in the other list is larger.
        elif a[i][0] < b[j][0]:
            i += 1
        else:
            j += 1
    return dot
