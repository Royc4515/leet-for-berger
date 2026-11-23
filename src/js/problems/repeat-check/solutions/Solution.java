import java.util.HashSet;
import java.util.Set;

class Solution {
    // O(n) average time, O(n) space: add() returns false on the first duplicate.
    public boolean hasRepeat(int[] nums) {
        Set<Integer> seen = new HashSet<>(nums.length * 2);
        for (int v : nums) {
            if (!seen.add(v)) return true;
        }
        return false;
    }
}
