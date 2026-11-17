from collections import OrderedDict, defaultdict


class LfuCache:
    # O(1) per call: for every use count, an OrderedDict of the keys with that count in recency
    # order (oldest first), plus the smallest count that still has keys.

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.entries = {}  # key -> [value, count]
        self.by_count = defaultdict(OrderedDict)
        self.min_count = 0

    def _touch(self, key: int, entry: list) -> None:
        count = entry[1]
        bucket = self.by_count[count]
        del bucket[key]
        if not bucket:
            del self.by_count[count]
            # The key was the last one with the smallest count, and it now has count + 1.
            if self.min_count == count:
                self.min_count += 1
        entry[1] = count + 1
        self.by_count[count + 1][key] = None

    def get(self, key: int) -> int:
        entry = self.entries.get(key)
        if entry is None:
            return -1
        self._touch(key, entry)
        return entry[0]

    def put(self, key: int, value: int) -> None:
        entry = self.entries.get(key)
        if entry is not None:
            # Storing over an existing key is a use as well.
            entry[0] = value
            self._touch(key, entry)
            return
        if len(self.entries) == self.capacity:
            bucket = self.by_count[self.min_count]
            # The oldest key among those with the smallest count.
            victim, _ = bucket.popitem(last=False)
            if not bucket:
                del self.by_count[self.min_count]
            del self.entries[victim]
        self.entries[key] = [value, 1]
        self.by_count[1][key] = None
        # A new key always has the smallest possible count.
        self.min_count = 1
