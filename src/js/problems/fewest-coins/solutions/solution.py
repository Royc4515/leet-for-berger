# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0322.Coin%20Change/Solution.py
def coin_change(coins: list[int], amount: int) -> int:
    # O(amount * len(coins)) time - the best way to pay a ends with some coin c, after paying a - c.
    # amount + 1 coins is impossible (every coin is at least 1), so it doubles as "unreachable".
    inf = amount + 1
    f = [0] + [inf] * amount
    # Coins in the outer loop: each pass allows one more denomination, reused any number of times.
    for x in coins:
        for j in range(x, amount + 1):
            if f[j - x] + 1 < f[j]:
                f[j] = f[j - x] + 1
    return -1 if f[amount] >= inf else f[amount]
