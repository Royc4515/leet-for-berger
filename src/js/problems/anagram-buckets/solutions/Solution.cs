public class Solution {
    // O(n * k log k) time - the sorted letters are the same key for every anagram.
    public IList<IList<string>> GroupAnagrams(string[] words) {
        // Dictionary order is not guaranteed, so it maps key -> group index; the list keeps order.
        var index = new Dictionary<string, int>();
        var groups = new List<IList<string>>();
        foreach (var w in words) {
            var letters = w.ToCharArray();
            Array.Sort(letters);
            var key = new string(letters);
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
