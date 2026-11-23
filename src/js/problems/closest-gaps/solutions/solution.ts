// O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
function minimumAbsDifference(arr: number[]): number[][] {
  // Numeric comparator: the default sort compares as strings and puts -10 before -4.
  const values = [...arr].sort((a, b) => a - b);
  let best = Infinity;
  for (let i = 1; i < values.length; i++) best = Math.min(best, values[i] - values[i - 1]);
  // Scanning left to right yields the pairs already in ascending order.
  const pairs: number[][] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] === best) pairs.push([values[i - 1], values[i]]);
  }
  return pairs;
}
