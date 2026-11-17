# O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
# item is visited once over the whole run.
class NestedIterator:

    def __init__(self, nested_list: list[NestedInteger]):
        # Each frame is a list and the index of its next unread item.
        self.stack = [[nested_list, 0]]

    def next(self) -> int:
        self.has_next()
        frame = self.stack[-1]
        value = frame[0][frame[1]].get_integer()
        frame[1] += 1
        return value

    def has_next(self) -> bool:
        # Settles on the next integer without consuming it, so calling this twice changes nothing.
        while self.stack:
            items, i = self.stack[-1]
            if i == len(items):
                self.stack.pop()
                continue
            if items[i].is_integer():
                return True
            self.stack[-1][1] += 1
            self.stack.append([items[i].get_list(), 0])
        return False
