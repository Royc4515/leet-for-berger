def shoreline_view(heights: list[int]) -> list[int]:
    # O(n) time, O(n) space: a monotonic stack of indices whose heights strictly decrease.
    stack: list[int] = []
    for i, h in enumerate(heights):
        # A building at least as tall as the one on top blocks it for good (equal heights block too).
        while stack and heights[stack[-1]] <= h:
            stack.pop()
        stack.append(i)
    # What is left sees the sea, already in increasing index order.
    return stack
