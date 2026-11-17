import java.util.*;

class Solution {
    // O(n + d log d) time - count once, then order the d distinct values by the rule.
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : nums) count.merge(x, 1, Integer::sum);
        List<Integer> values = new ArrayList<>(count.keySet());
        values.sort((a, b) -> !count.get(a).equals(count.get(b)) ? count.get(b) - count.get(a) : Integer.compare(a, b));
        int[] out = new int[k];
        for (int i = 0; i < k; i++) out[i] = values.get(i);
        return out;
    }
}
