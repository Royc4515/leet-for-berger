public class Solution {
    // O(n * L) hash lookups for text length n and longest word L: reach[i] says the first i
    // characters split cleanly.
    public bool CanSplit(string text, string[] words) {
        var dictionary = new HashSet<string>(words);
        // Only lengths that occur in the dictionary can end a piece, so at most 20 probes per position.
        var lengths = new SortedSet<int>();
        foreach (var w in words) lengths.Add(w.Length);
        int n = text.Length;
        var reach = new bool[n + 1];
        reach[0] = true;
        for (int i = 1; i <= n; i++) {
            foreach (int length in lengths) {
                if (length > i) break;
                if (reach[i - length] && dictionary.Contains(text.Substring(i - length, length))) {
                    reach[i] = true;
                    break;
                }
            }
        }
        return reach[n];
    }
}
