using System.Collections.Generic;

public class Solution {
    // O(n) average time, O(n) space: Add returns false on the first duplicate.
    public bool HasRepeat(int[] nums) {
        var seen = new HashSet<int>(nums.Length);
        foreach (int v in nums) {
            if (!seen.Add(v)) return true;
        }
        return false;
    }
}
