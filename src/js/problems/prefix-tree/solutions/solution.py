END = '$'


class Trie:
    # O(length of the argument) per call. Each node is a dict from letter to child; the key '$'
    # (never a lowercase letter) marks that an inserted word ends at this node.

    def __init__(self):
        self.root = {}

    def insert(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node[END] = True

    def search(self, word: str) -> bool:
        node = self._walk(word)
        # The path existing is not enough: "app" exists inside "apple" without being a word.
        return node is not None and END in node

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s: str):
        node = self.root
        for c in s:
            node = node.get(c)
            if node is None:
                return None
        return node
