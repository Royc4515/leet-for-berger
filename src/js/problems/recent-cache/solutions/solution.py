from collections import OrderedDict


class LruCache:
    # O(1) per call. OrderedDict is a hash map threaded by a doubly linked list, exactly the
    # structure this problem asks for: move_to_end and popitem(last=False) are O(1).

    def __init__(self, capacity: int):
        self.capacity = capacity
        # Ordered from least recently used (front) to most recently used (back).
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        # A successful read counts as a use, so the key becomes the most recent.
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            # Updating an existing key refreshes it but does not grow the cache.
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
