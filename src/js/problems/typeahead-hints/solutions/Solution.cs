public class Solution {
    // O(n log n + L log n): sort once, then for each typed prefix the matching names form one
    // block that starts at the first name that is not smaller than the prefix.
    public IList<IList<string>> SuggestNames(string[] products, string searchWord) {
        var sorted = (string[])products.Clone();
        // Ordinal comparison is dictionary order for lowercase letters and ignores the culture.
        Array.Sort(sorted, StringComparer.Ordinal);
        var output = new List<IList<string>>();
        int start = 0;
        for (int i = 1; i <= searchWord.Length; i++) {
            string prefix = searchWord.Substring(0, i);
            // A longer prefix keeps only a subset of the shorter one's matches, so the search can
            // begin where the previous one ended.
            int low = start, high = sorted.Length;
            while (low < high) {
                int mid = low + (high - low) / 2;
                if (string.CompareOrdinal(sorted[mid], prefix) < 0) low = mid + 1;
                else high = mid;
            }
            start = low;
            var row = new List<string>();
            for (int j = start; j < sorted.Length && row.Count < 3 && sorted[j].StartsWith(prefix, StringComparison.Ordinal); j++) {
                row.Add(sorted[j]);
            }
            output.Add(row);
        }
        return output;
    }
}
