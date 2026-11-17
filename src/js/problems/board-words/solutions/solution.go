// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0212.Word%20Search%20II/Solution.go
import "sort"

// One trie for all words, one backtracking search from each cell that follows the trie, so words
// sharing a beginning share the walk. Found words leave the trie and emptied branches are cut,
// so finished parts of the trie are never walked again.
type wordTrie struct {
	children [26]*wordTrie
	kids     int
	ref      int
}

func newWordTrie() *wordTrie {
	return &wordTrie{ref: -1}
}

func (this *wordTrie) insert(w string, ref int) {
	node := this
	for i := 0; i < len(w); i++ {
		c := w[i] - 'a'
		if node.children[c] == nil {
			node.children[c] = newWordTrie()
			node.kids++
		}
		node = node.children[c]
	}
	node.ref = ref
}

func findWords(board []string, words []string) []string {
	trie := newWordTrie()
	for i, w := range words {
		trie.insert(w, i)
	}
	m, n := len(board), len(board[0])
	// Strings are immutable in Go, so the search marks cells in a byte copy of the board.
	grid := make([][]byte, m)
	for i := range board {
		grid[i] = []byte(board[i])
	}
	ans := []string{}
	dirs := [5]int{-1, 0, 1, 0, -1}
	var dfs func(*wordTrie, int, int)
	dfs = func(parent *wordTrie, i, j int) {
		idx := grid[i][j] - 'a'
		node := parent.children[idx]
		if node.ref != -1 {
			// Clearing the mark reports each word once, however many paths spell it.
			ans = append(ans, words[node.ref])
			node.ref = -1
		}
		c := grid[i][j]
		// '#' is not a letter, so the cell cannot be reused further down this path.
		grid[i][j] = '#'
		for k := 0; k < 4; k++ {
			x, y := i+dirs[k], j+dirs[k+1]
			if x >= 0 && x < m && y >= 0 && y < n && grid[x][y] != '#' && node.children[grid[x][y]-'a'] != nil {
				dfs(node, x, y)
			}
		}
		grid[i][j] = c
		if node.kids == 0 && node.ref == -1 {
			parent.children[idx] = nil
			parent.kids--
		}
	}
	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if trie.children[grid[i][j]-'a'] != nil {
				dfs(trie, i, j)
			}
		}
	}
	sort.Strings(ans)
	return ans
}
