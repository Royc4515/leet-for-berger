// O(n) time, O(1) space - Josephus recurrence. After one player leaves, the rest play the same
// game with size - 1 players starting k seats later, so a winner's position in the smaller
// circle maps to (position + k) % size in the bigger one. A loop avoids 10^5-deep recursion.
function findTheWinner(n: number, k: number): number {
  let pos = 0; // the winner's 0-based seat when only one player is left
  for (let size = 2; size <= n; size++) pos = (pos + k) % size;
  return pos + 1;
}
