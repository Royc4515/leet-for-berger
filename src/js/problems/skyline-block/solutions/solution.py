def largest_block(heights: list[int]) -> int:
    # O(n) time: a stack of indexes with increasing heights. A bar that is not taller than the top
    # pops it, and then both limits of the popped bar are known.
    stack = []
    best = 0
    n = len(heights)
    for i in range(n + 1):
        # A height-0 sentinel after the last bar pops everything still waiting.
        h = heights[i] if i < n else 0
        while stack and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            # Everything between the new top (exclusive) and i (exclusive) is at least this tall.
            left = stack[-1] if stack else -1
            best = max(best, height * (i - left - 1))
        stack.append(i)
    return best
