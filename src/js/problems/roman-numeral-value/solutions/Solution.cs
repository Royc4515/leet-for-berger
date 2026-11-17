public class Solution {
    // O(n) time - each symbol only needs its right neighbour to know its sign.
    public int RomanToInt(string s) {
        int total = 0;
        for (int i = 0; i < s.Length; i++) {
            int v = Value(s[i]);
            // A smaller symbol before a larger one is the left half of a subtractive pair (IV, CM).
            if (i + 1 < s.Length && v < Value(s[i + 1])) total -= v;
            else total += v;
        }
        return total;
    }

    private static int Value(char c) => c switch {
        'I' => 1,
        'V' => 5,
        'X' => 10,
        'L' => 50,
        'C' => 100,
        'D' => 500,
        _ => 1000,
    };
}
