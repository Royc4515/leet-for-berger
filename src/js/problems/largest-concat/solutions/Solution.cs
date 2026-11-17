public class Solution {
    // O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
    public string LargestNumber(int[] nums) {
        string[] parts = Array.ConvertAll(nums, v => v.ToString());
        // a + b and b + a have the same length, so ordinal order is numeric order. Ordinal matters:
        // culture-aware comparison is not guaranteed to order digits by value.
        Array.Sort(parts, (a, b) => string.CompareOrdinal(b + a, a + b));
        // The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
        return parts[0] == "0" ? "0" : string.Concat(parts);
    }
}
