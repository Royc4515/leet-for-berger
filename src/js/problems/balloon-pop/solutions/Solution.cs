public class Solution {
    // O(n^3) time, O(n^2) space. f[i, j] is the best total for popping everything strictly
    // between borders i and j; the balloon popped last has the borders as neighbors.
    public int MaxCoins(int[] nums) {
        int n = nums.Length;
        var arr = new int[n + 2];
        arr[0] = arr[n + 1] = 1;
        Array.Copy(nums, 0, arr, 1, n);
        var f = new int[n + 2, n + 2];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i + 2; j <= n + 1; j++) {
                int best = 0;
                for (int k = i + 1; k < j; k++) best = Math.Max(best, f[i, k] + f[k, j] + arr[i] * arr[k] * arr[j]);
                f[i, j] = best;
            }
        }
        return f[0, n + 1];
    }
}
