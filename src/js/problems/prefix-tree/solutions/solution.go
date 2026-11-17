// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0208.Implement%20Trie%20(Prefix%20Tree)/Solution.go
// O(length of the argument) per call: every node is itself a Trie for the words below it, with
// 26 child slots.
type Trie struct {
	children [26]*Trie
	isEnd    bool
}

func Constructor() Trie {
	return Trie{}
}

func (this *Trie) Insert(word string) {
	node := this
	for i := 0; i < len(word); i++ {
		idx := word[i] - 'a'
		if node.children[idx] == nil {
			node.children[idx] = &Trie{}
		}
		node = node.children[idx]
	}
	node.isEnd = true
}

func (this *Trie) Search(word string) bool {
	node := this.searchPrefix(word)
	// The path existing is not enough: "app" exists inside "apple" without being a word.
	return node != nil && node.isEnd
}

func (this *Trie) StartsWith(prefix string) bool {
	return this.searchPrefix(prefix) != nil
}

func (this *Trie) searchPrefix(s string) *Trie {
	node := this
	for i := 0; i < len(s); i++ {
		node = node.children[s[i]-'a']
		if node == nil {
			return nil
		}
	}
	return node
}
