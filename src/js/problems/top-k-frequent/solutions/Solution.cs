public class Solution {
    // O(n + d log d) time - count once, then order the d distinct values by the rule.
    public int[] TopKFrequent(int[] nums, int k) {
        var count = new Dictionary<int, int>();
        foreach (var x in nums) count[x] = count.GetValueOrDefault(x) + 1;
        return count.Keys
            .OrderByDescending(v => count[v])
            .ThenBy(v => v)
            .Take(k)
            .ToArray();
    }
}
