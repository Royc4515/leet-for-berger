# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0518.Coin%20Change%20II/Solution.py
def change(amount: int, coins: list[int]) -> int:
    # O(amount * coins) time, O(amount) space. The coin loop is outside, so every combination
    # is built in one fixed coin order and counted once (amount outside would count orders).
    mod = 1_000_000_007
    ways = [0] * (amount + 1)
    ways[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            ways[a] = (ways[a] + ways[a - c]) % mod
    return ways[amount]
