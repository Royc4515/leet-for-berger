class MinStack:
    # O(1) per operation: every entry remembers the minimum of the stack up to and including it.

    def __init__(self):
        self.stack = []

    def push(self, val: int) -> None:
        current = self.stack[-1][1] if self.stack else val
        # The minimum below an entry never changes while that entry sits on the stack.
        self.stack.append((val, min(val, current)))

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0]

    def get_min(self) -> int:
        return self.stack[-1][1]
