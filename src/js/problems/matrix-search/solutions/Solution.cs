public class Solution {
    // O(log(m * n)) time - the rows read in order form one sorted list; index i is cell (i / n, i % n).
    public bool SearchMatrix(int[][] matrix, int target) {
        int m = matrix.Length, n = matrix[0].Length;
        // Find the first position whose value is >= target, then check whether it is the target.
        int left = 0, right = m * n - 1;
        while (left < right) {
            int mid = (left + right) >> 1;
            if (matrix[mid / n][mid % n] >= target) right = mid;
            else left = mid + 1;
        }
        return matrix[left / n][left % n] == target;
    }
}
