class RingQueue:
    # O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
    # count (instead of a tail index) tells empty from full without wasting a slot.

    def __init__(self, capacity: int):
        self.data = [0] * capacity
        self.cap = capacity
        self.head = 0
        self.size = 0

    def push(self, value: int) -> bool:
        if self.size == self.cap:
            return False
        # The next free slot is `size` steps after the front, wrapping past the end of the array.
        self.data[(self.head + self.size) % self.cap] = value
        self.size += 1
        return True

    def pop(self) -> bool:
        if self.size == 0:
            return False
        self.head = (self.head + 1) % self.cap
        self.size -= 1
        return True

    def front(self) -> int:
        return -1 if self.size == 0 else self.data[self.head]

    def back(self) -> int:
        return -1 if self.size == 0 else self.data[(self.head + self.size - 1) % self.cap]

    def is_empty(self) -> bool:
        return self.size == 0

    def is_full(self) -> bool:
        return self.size == self.cap
