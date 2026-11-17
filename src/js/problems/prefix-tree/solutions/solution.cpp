// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0208.Implement%20Trie%20(Prefix%20Tree)/Solution.cpp
// O(length of the argument) per call: every node is itself a Trie for the words below it, with
// 26 child slots.
class Trie {
private:
    Trie* children[26] = {};
    bool isEnd = false;

    // const reference: copying a 2000-letter argument on every call would double the work.
    Trie* searchPrefix(const string& s) {
        Trie* node = this;
        for (char c : s) {
            node = node->children[c - 'a'];
            if (!node) return nullptr;
        }
        return node;
    }

public:
    Trie() {}

    ~Trie() {
        for (Trie* child : children) delete child;
    }

    void insert(string word) {
        Trie* node = this;
        for (char c : word) {
            int idx = c - 'a';
            if (!node->children[idx]) node->children[idx] = new Trie();
            node = node->children[idx];
        }
        node->isEnd = true;
    }

    bool search(string word) {
        Trie* node = searchPrefix(word);
        // The path existing is not enough: "app" exists inside "apple" without being a word.
        return node != nullptr && node->isEnd;
    }

    bool startsWith(string prefix) {
        return searchPrefix(prefix) != nullptr;
    }
};
