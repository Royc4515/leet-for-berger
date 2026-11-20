from bisect import bisect_right
from collections import defaultdict


class CheckpointArray:
    # set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
    # checkpoint they were made under. Ids only grow, so each slot's list stays sorted.

    def __init__(self, length: int):
        self.ids = defaultdict(list)
        self.vals = defaultdict(list)
        self.taken = 0

    def set(self, index: int, val: int) -> None:
        ids = self.ids[index]
        # A second write inside the same checkpoint replaces the first one.
        if ids and ids[-1] == self.taken:
            self.vals[index][-1] = val
        else:
            ids.append(self.taken)
            self.vals[index].append(val)

    def snap(self) -> int:
        self.taken += 1
        return self.taken - 1

    def get(self, index: int, snap_id: int) -> int:
        ids = self.ids.get(index)
        if not ids:
            return 0
        # The last write made under an id <= snap_id; none means the slot was still untouched.
        pos = bisect_right(ids, snap_id)
        return self.vals[index][pos - 1] if pos else 0
