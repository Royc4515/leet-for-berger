// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0212.Word%20Search%20II/Solution.ts
// One trie for all words, one backtracking search from each cell that follows the trie, so words
// sharing a beginning share the walk. Found words leave the trie and emptied branches are cut,
// so finished parts of the trie are never walked again.
class WordTrie {
  children: (WordTrie | null)[] = new Array(26).fill(null);
  kids = 0;
  ref = -1;

  insert(w: string, ref: number): void {
    let node: WordTrie = this;
    for (let i = 0; i < w.length; i++) {
      const c = w.charCodeAt(i) - 97;
      if (node.children[c] === null) {
        node.children[c] = new WordTrie();
        node.kids++;
      }
      node = node.children[c]!;
    }
    node.ref = ref;
  }
}

function findWords(board: string[], words: string[]): string[] {
  const tree = new WordTrie();
  for (let i = 0; i < words.length; ++i) {
    tree.insert(words[i], i);
  }
  const m = board.length;
  const n = board[0].length;
  // Letter codes 0..25, and -1 for a cell on the current path.
  const grid = board.map((row) => Array.from(row, (ch) => ch.charCodeAt(0) - 97));
  const ans: string[] = [];
  const dirs = [-1, 0, 1, 0, -1];
  const dfs = (parent: WordTrie, i: number, j: number): void => {
    const idx = grid[i][j];
    const node = parent.children[idx]!;
    if (node.ref !== -1) {
      // Clearing the mark reports each word once, however many paths spell it.
      ans.push(words[node.ref]);
      node.ref = -1;
    }
    grid[i][j] = -1;
    for (let k = 0; k < 4; ++k) {
      const x = i + dirs[k];
      const y = j + dirs[k + 1];
      if (x >= 0 && x < m && y >= 0 && y < n && grid[x][y] !== -1 && node.children[grid[x][y]] !== null) {
        dfs(node, x, y);
      }
    }
    grid[i][j] = idx;
    if (node.kids === 0 && node.ref === -1) {
      parent.children[idx] = null;
      parent.kids--;
    }
  };
  for (let i = 0; i < m; ++i) {
    for (let j = 0; j < n; ++j) {
      if (tree.children[grid[i][j]] !== null) dfs(tree, i, j);
    }
  }
  // Plain sort compares UTF-16 code units, which is dictionary order for lowercase letters.
  return ans.sort();
}
