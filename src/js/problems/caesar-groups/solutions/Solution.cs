public class Solution {
    // O(n * k) time: every word is normalized once, then grouped by that key.
    public IList<IList<string>> GroupByShift(string[] words) {
        // Dictionary order is not guaranteed, so it maps key -> group index; the list keeps order.
        var index = new Dictionary<string, int>();
        var groups = new List<IList<string>>();
        foreach (var w in words) {
            var t = w.ToCharArray();
            int diff = t[0] - 'a';
            for (int i = 0; i < t.Length; i++) {
                // Shift back so the word starts with 'a'; a letter that falls below 'a' wraps.
                t[i] = (char)(t[i] - diff);
                if (t[i] < 'a') {
                    t[i] = (char)(t[i] + 26);
                }
            }
            var key = new string(t);
            if (index.TryGetValue(key, out int g)) {
                groups[g].Add(w);
            } else {
                index[key] = groups.Count;
                groups.Add(new List<string> { w });
            }
        }
        return groups;
    }
}
