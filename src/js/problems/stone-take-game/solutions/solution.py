# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0292.Nim%20Game/Solution.py
def can_win_stones(n: int) -> bool:
    # O(1): the losing sizes are the multiples of 4. From any other size, taking n % 4 stones
    # hands the opponent a multiple of 4, and from a multiple of 4 every move leaves a non-multiple.
    return n % 4 != 0
