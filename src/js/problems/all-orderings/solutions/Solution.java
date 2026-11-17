// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0046.Permutations/Solution.java
import java.util.*;

class Solution {
    private List<List<Integer>> ans;
    private List<Integer> t;
    private boolean[] vis;
    private int[] nums;

    // O(n! * n) time - fill positions left to right with any unused value. Sorting first and
    // trying values in ascending order emits the permutations in lexicographic order.
    public List<List<Integer>> permute(int[] nums) {
        // Fresh state per call: the same object may be asked more than once.
        ans = new ArrayList<>();
        t = new ArrayList<>();
        this.nums = nums.clone();
        Arrays.sort(this.nums);
        vis = new boolean[nums.length];
        dfs(0);
        return ans;
    }

    private void dfs(int i) {
        if (i == nums.length) {
            ans.add(new ArrayList<>(t));
            return;
        }
        for (int j = 0; j < nums.length; ++j) {
            if (!vis[j]) {
                vis[j] = true;
                t.add(nums[j]);
                dfs(i + 1);
                // Release the value so sibling branches can place it later.
                t.remove(t.size() - 1);
                vis[j] = false;
            }
        }
    }
}
