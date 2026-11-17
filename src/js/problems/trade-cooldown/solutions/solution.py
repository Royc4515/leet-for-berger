def max_profit(prices: list[int]) -> int:
    # O(n) time, O(1) space. Three states at the end of each day: holding a share, having sold
    # today, or resting with no share. A buy may only follow a rest day, never a sale.
    hold, sold, rest = -prices[0], 0, 0
    for p in prices[1:]:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)
