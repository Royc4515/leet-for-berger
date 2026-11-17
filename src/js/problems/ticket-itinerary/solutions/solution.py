# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0332.Reconstruct%20Itinerary/Solution.py
from collections import defaultdict


def find_itinerary(tickets: list[list[str]]) -> list[str]:
    # O(E log E) - Hierholzer's algorithm. Destinations are stored in descending order so the
    # smallest unused one is always at the end, where pop() is O(1).
    g = defaultdict(list)
    for f, t in sorted(tickets, reverse=True):
        g[f].append(t)
    # An explicit stack instead of recursion: the walk can be 3 * 10^4 tickets deep, far past
    # Python's recursion limit.
    stack = ["JFK"]
    ans = []
    while stack:
        f = stack[-1]
        if g[f]:
            stack.append(g[f].pop())
        else:
            # No tickets left here, so this airport comes after everything still on the
            # stack: the route is built back to front.
            ans.append(stack.pop())
    return ans[::-1]
