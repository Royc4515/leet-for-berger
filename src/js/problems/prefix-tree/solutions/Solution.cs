// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0208.Implement%20Trie%20(Prefix%20Tree)/Solution.cs
// O(length of the argument) per call: every node is itself a Trie for the words below it, with
// 26 child slots.
public class Trie {
    private bool isEnd;
    private readonly Trie[] children = new Trie[26];

    public Trie() {
    }

    public void Insert(string word) {
        Trie node = this;
        foreach (var c in word) {
            var idx = c - 'a';
            node.children[idx] ??= new Trie();
            node = node.children[idx];
        }
        node.isEnd = true;
    }

    public bool Search(string word) {
        Trie node = SearchPrefix(word);
        // The path existing is not enough: "app" exists inside "apple" without being a word.
        return node != null && node.isEnd;
    }

    public bool StartsWith(string prefix) {
        return SearchPrefix(prefix) != null;
    }

    private Trie SearchPrefix(string s) {
        Trie node = this;
        foreach (var c in s) {
            node = node.children[c - 'a'];
            if (node == null) {
                return null;
            }
        }
        return node;
    }
}
