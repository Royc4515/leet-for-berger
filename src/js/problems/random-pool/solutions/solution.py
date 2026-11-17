import random


# O(1) average per operation: the values sit in a dense array for uniform picks, and a map from
# value to array index makes membership and removal constant time.
class RandomizedSet:

    def __init__(self):
        self.values = []
        self.index = {}

    def insert(self, val: int) -> bool:
        if val in self.index:
            return False
        self.index[val] = len(self.values)
        self.values.append(val)
        return True

    def remove(self, val: int) -> bool:
        i = self.index.pop(val, None)
        if i is None:
            return False
        # Order does not matter, so the last value fills the hole and the array stays dense.
        last = self.values.pop()
        if i < len(self.values):
            self.values[i] = last
            self.index[last] = i
        return True

    def get_random(self) -> int:
        return random.choice(self.values)
