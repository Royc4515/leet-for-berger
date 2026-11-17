def find_the_winner(n: int, k: int) -> int:
    # O(n) time, O(1) space - Josephus recurrence. After one player leaves, the rest play the
    # same game with size - 1 players starting k seats later, so a winner's position in the
    # smaller circle maps to (position + k) % size in the bigger one.
    # A loop, not recursion: n = 10^5 would blow Python's recursion limit.
    pos = 0  # the winner's 0-based seat when only one player is left
    for size in range(2, n + 1):
        pos = (pos + k) % size
    return pos + 1
