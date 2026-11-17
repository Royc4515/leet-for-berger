def is_valid(s: str) -> bool:
    # O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            # An empty stack means a closer with nothing open.
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    # Leftover openers were never closed.
    return not stack
