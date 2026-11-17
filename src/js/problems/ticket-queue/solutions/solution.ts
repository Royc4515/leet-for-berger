// O(n) time - count what the simulation would do instead of running it.
function timeToBuy(tickets: number[], k: number): number {
  const target = tickets[k];
  let total = 0;
  for (let i = 0; i < tickets.length; i++) {
    // Everyone ahead of k gets target turns, everyone behind target - 1; nobody buys extra.
    total += Math.min(tickets[i], i <= k ? target : target - 1);
  }
  return total;
}
