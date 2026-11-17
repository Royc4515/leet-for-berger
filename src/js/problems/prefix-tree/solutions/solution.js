// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0208.Implement%20Trie%20(Prefix%20Tree)/Solution.ts
// O(length of the argument) per call: one node per distinct prefix, 26 child slots each.
class TrieNode {
  constructor() {
    this.children = new Array(26);
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * @param {string} word
   * @return {void}
   */
  insert(word) {
    let head = this.root;
    for (let i = 0; i < word.length; i++) {
      const index = word.charCodeAt(i) - 97;
      if (!head.children[index]) {
        head.children[index] = new TrieNode();
      }
      head = head.children[index];
    }
    head.isEnd = true;
  }

  /**
   * @param {string} word
   * @return {boolean}
   */
  search(word) {
    const head = this.searchPrefix(word);
    // The path existing is not enough: "app" exists inside "apple" without being a word.
    return head != null && head.isEnd;
  }

  /**
   * @param {string} prefix
   * @return {boolean}
   */
  startsWith(prefix) {
    return this.searchPrefix(prefix) != null;
  }

  searchPrefix(prefix) {
    let head = this.root;
    for (let i = 0; i < prefix.length; i++) {
      head = head.children[prefix.charCodeAt(i) - 97];
      if (!head) return null;
    }
    return head;
  }
}
