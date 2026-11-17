def time_to_buy(tickets: list[int], k: int) -> int:
    # O(n) time - count what the simulation would do instead of running it.
    target = tickets[k]
    # By the time person k buys their last ticket, everyone ahead has had target turns and
    # everyone behind target - 1 turns; nobody buys more than they need.
    return sum(min(t, target if i <= k else target - 1) for i, t in enumerate(tickets))
