// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0349.Intersection%20of%20Two%20Arrays/Solution.java
import java.util.*;

class Solution {
    // O(n + m + k log k) time: set lookups replace the O(n * m) nested loop.
    public int[] commonValues(int[] nums1, int[] nums2) {
        Set<Integer> inFirst = new HashSet<>();
        for (int x : nums1) {
            inFirst.add(x);
        }
        List<Integer> ans = new ArrayList<>();
        for (int x : nums2) {
            // Removing a match means a repeat in nums2 cannot report it again.
            if (inFirst.remove(x)) {
                ans.add(x);
            }
        }
        int[] out = ans.stream().mapToInt(Integer::intValue).toArray();
        Arrays.sort(out);
        return out;
    }
}
