def find_words(board: list[str], words: list[str]) -> list[str]:
    # One trie for all words, one backtracking search from each cell that follows the trie, so
    # words sharing a beginning share the walk. Found words leave the trie and emptied branches
    # are cut, so finished parts of the trie are never walked again.
    root = {}
    for w in words:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        # '$' is never a letter, so it can mark the end of a word in the same dict.
        node['$'] = w

    m, n = len(board), len(board[0])
    grid = [list(row) for row in board]
    found = []

    def dfs(parent: dict, i: int, j: int) -> None:
        c = grid[i][j]
        node = parent[c]
        w = node.pop('$', None)
        if w is not None:
            # Removing the mark reports each word once, however many paths spell it.
            found.append(w)
        # '#' is in no trie node, so the cell cannot be reused further down this path.
        grid[i][j] = '#'
        for x, y in ((i - 1, j), (i + 1, j), (i, j - 1), (i, j + 1)):
            if 0 <= x < m and 0 <= y < n and grid[x][y] in node:
                dfs(node, x, y)
        grid[i][j] = c
        if not node:
            del parent[c]

    for i in range(m):
        for j in range(n):
            if grid[i][j] in root:
                dfs(root, i, j)
    found.sort()
    return found
