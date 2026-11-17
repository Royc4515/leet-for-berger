// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0046.Permutations/Solution.cs
public class Solution {
    // O(n! * n) time - fill positions left to right with any unused value. Sorting first and
    // trying values in ascending order emits the permutations in lexicographic order.
    public IList<IList<int>> Permute(int[] nums) {
        var a = (int[])nums.Clone();
        Array.Sort(a);
        var ans = new List<IList<int>>();
        var t = new List<int>();
        var vis = new bool[a.Length];
        dfs(a, 0, t, vis, ans);
        return ans;
    }

    private void dfs(int[] nums, int i, IList<int> t, bool[] vis, IList<IList<int>> ans) {
        if (i >= nums.Length) {
            ans.Add(new List<int>(t));
            return;
        }
        for (int j = 0; j < nums.Length; ++j) {
            if (!vis[j]) {
                vis[j] = true;
                t.Add(nums[j]);
                dfs(nums, i + 1, t, vis, ans);
                // Release the value so sibling branches can place it later.
                t.RemoveAt(t.Count - 1);
                vis[j] = false;
            }
        }
    }
}
