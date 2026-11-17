// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0078.Subsets/Solution.java
import java.util.*;

class Solution {
    private List<List<Integer>> ans;
    private List<Integer> t;
    private int[] nums;

    // O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
    // entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
    public List<List<Integer>> subsets(int[] nums) {
        // Fresh state per call: the same object may be asked more than once.
        ans = new ArrayList<>();
        t = new ArrayList<>();
        this.nums = nums.clone();
        Arrays.sort(this.nums);
        dfs(0);
        return ans;
    }

    private void dfs(int start) {
        ans.add(new ArrayList<>(t));
        for (int i = start; i < nums.length; i++) {
            t.add(nums[i]);
            dfs(i + 1);
            t.remove(t.size() - 1);
        }
    }
}
