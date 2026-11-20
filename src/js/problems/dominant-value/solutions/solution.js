// O(n) time, O(1) space - a candidate and a tally; every different value cancels one copy of it.
function majorityElement(nums) {
  let candidate = 0;
  let tally = 0;
  for (const v of nums) {
    // The prefix so far cancelled out evenly, so the majority is still the majority of the rest.
    if (tally === 0) candidate = v;
    tally += v === candidate ? 1 : -1;
  }
  return candidate;
}
