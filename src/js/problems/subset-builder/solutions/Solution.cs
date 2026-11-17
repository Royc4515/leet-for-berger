public class Solution {
    private List<IList<int>> ans;
    private List<int> t;
    private int[] a;

    // O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
    // entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
    public IList<IList<int>> Subsets(int[] nums) {
        // Fresh state per call: the same object may be asked more than once.
        ans = new List<IList<int>>();
        t = new List<int>();
        a = (int[])nums.Clone();
        Array.Sort(a);
        Dfs(0);
        return ans;
    }

    private void Dfs(int start) {
        ans.Add(new List<int>(t));
        for (int i = start; i < a.Length; i++) {
            t.Add(a[i]);
            Dfs(i + 1);
            t.RemoveAt(t.Count - 1);
        }
    }
}
