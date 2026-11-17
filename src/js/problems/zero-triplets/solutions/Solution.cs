public class Solution {
    // O(n^2) time - sort, fix the smallest value, then two pointers on the rest.
    public IList<IList<int>> ThreeSum(int[] nums) {
        var a = (int[])nums.Clone();
        Array.Sort(a);
        var output = new List<IList<int>>();
        for (int i = 0; i < a.Length - 2; i++) {
            // Sorted: once the smallest value is positive, no triplet can reach zero.
            if (a[i] > 0) break;
            // Equal neighbours would produce the same triplets again.
            if (i > 0 && a[i] == a[i - 1]) continue;
            int lo = i + 1, hi = a.Length - 1;
            while (lo < hi) {
                int sum = a[i] + a[lo] + a[hi];
                if (sum < 0) lo++;
                else if (sum > 0) hi--;
                else {
                    output.Add(new List<int> { a[i], a[lo], a[hi] });
                    lo++;
                    hi--;
                    // Step past repeats of the pair just used, so it is reported once.
                    while (lo < hi && a[lo] == a[lo - 1]) lo++;
                    while (lo < hi && a[hi] == a[hi + 1]) hi--;
                }
            }
        }
        return output;
    }
}
