import java.util.*;

class Solution {
    // O(n) time, O(n) space - one pass, value -> index.
    public int[] pairSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int j = 0; j < nums.length; j++) {
            // Look before storing nums[j], so a position is never paired with itself.
            Integer i = seen.get(target - nums[j]);
            if (i != null) return new int[] { i, j };
            seen.put(nums[j], j);
        }
        return new int[0];
    }
}
