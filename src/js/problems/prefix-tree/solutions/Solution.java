// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0208.Implement%20Trie%20(Prefix%20Tree)/Solution.java
// O(length of the argument) per call: every node is itself a Trie for the words below it, with
// 26 child slots.
class Trie {
    private final Trie[] children;
    private boolean isEnd;

    public Trie() {
        children = new Trie[26];
    }

    public void insert(String word) {
        Trie node = this;
        for (int i = 0; i < word.length(); i++) {
            int idx = word.charAt(i) - 'a';
            if (node.children[idx] == null) {
                node.children[idx] = new Trie();
            }
            node = node.children[idx];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        Trie node = searchPrefix(word);
        // The path existing is not enough: "app" exists inside "apple" without being a word.
        return node != null && node.isEnd;
    }

    public boolean startsWith(String prefix) {
        return searchPrefix(prefix) != null;
    }

    private Trie searchPrefix(String s) {
        Trie node = this;
        for (int i = 0; i < s.length(); i++) {
            node = node.children[s.charAt(i) - 'a'];
            if (node == null) {
                return null;
            }
        }
        return node;
    }
}
