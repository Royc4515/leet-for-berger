import java.util.*;

class Solution {
    // O(n^2) time - sort, fix the smallest value, then two pointers on the rest.
    public List<List<Integer>> threeSum(int[] nums) {
        int[] a = nums.clone();
        Arrays.sort(a);
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < a.length - 2; i++) {
            // Sorted: once the smallest value is positive, no triplet can reach zero.
            if (a[i] > 0) break;
            // Equal neighbours would produce the same triplets again.
            if (i > 0 && a[i] == a[i - 1]) continue;
            int lo = i + 1, hi = a.length - 1;
            while (lo < hi) {
                int sum = a[i] + a[lo] + a[hi];
                if (sum < 0) lo++;
                else if (sum > 0) hi--;
                else {
                    out.add(List.of(a[i], a[lo], a[hi]));
                    lo++;
                    hi--;
                    // Step past repeats of the pair just used, so it is reported once.
                    while (lo < hi && a[lo] == a[lo - 1]) lo++;
                    while (lo < hi && a[hi] == a[hi + 1]) hi--;
                }
            }
        }
        return out;
    }
}
