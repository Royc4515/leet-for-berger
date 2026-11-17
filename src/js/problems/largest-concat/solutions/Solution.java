import java.util.*;

class Solution {
    // O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
    public String largestNumber(int[] nums) {
        String[] parts = new String[nums.length];
        for (int i = 0; i < nums.length; i++) parts[i] = String.valueOf(nums[i]);
        // a + b and b + a have the same length, so string order is numeric order. Comparing them
        // as longs would overflow: two 10-digit values make a 20-digit number.
        Arrays.sort(parts, (a, b) -> (b + a).compareTo(a + b));
        // The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
        if (parts[0].equals("0")) return "0";
        StringBuilder sb = new StringBuilder();
        for (String p : parts) sb.append(p);
        return sb.toString();
    }
}
