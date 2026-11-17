from collections import deque


def max_sliding_window(nums: list[int], k: int) -> list[int]:
    # O(n) time - a deque of indices whose values strictly decrease from front to back.
    dq = deque()
    out = []
    for i, v in enumerate(nums):
        # A value no larger than the newcomer can never be a maximum again: it leaves first.
        while dq and nums[dq[-1]] <= v:
            dq.pop()
        dq.append(i)
        # The front is the window maximum unless it has slid out on the left.
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out
