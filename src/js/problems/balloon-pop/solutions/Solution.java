// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0312.Burst%20Balloons/Solution.java
class Solution {
    // O(n^3) time, O(n^2) space. f[i][j] is the best total for popping everything strictly
    // between borders i and j; the balloon popped last has the borders as neighbors.
    public int maxCoins(int[] nums) {
        int n = nums.length;
        int[] arr = new int[n + 2];
        arr[0] = 1;
        arr[n + 1] = 1;
        System.arraycopy(nums, 0, arr, 1, n);
        int[][] f = new int[n + 2][n + 2];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i + 2; j <= n + 1; j++) {
                for (int k = i + 1; k < j; k++) {
                    f[i][j] = Math.max(f[i][j], f[i][k] + f[k][j] + arr[i] * arr[k] * arr[j]);
                }
            }
        }
        return f[0][n + 1];
    }
}
