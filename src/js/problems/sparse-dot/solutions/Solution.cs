public class Solution {
    // O(a + b) time - both lists are sorted by index, so a merge finds the shared indices.
    public int SparseDot(int[][] a, int[][] b) {
        int i = 0, j = 0, dot = 0;
        while (i < a.Length && j < b.Length) {
            if (a[i][0] == b[j][0]) {
                // At most 10^5 * 100 * 100 = 10^9 in total, which fits in an int.
                dot += a[i][1] * b[j][1];
                i++;
                j++;
            } else if (a[i][0] < b[j][0]) {
                // The smaller index can never meet a partner: every later index in the other list is larger.
                i++;
            } else {
                j++;
            }
        }
        return dot;
    }
}
