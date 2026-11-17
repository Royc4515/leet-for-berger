public class Solution {
    // O(M + R + K log K) time, O(M + K) space - index groups once.
    public int[] NotifyRecipients(int[][] users, string[] requests) {
        var known = new HashSet<int>();
        var members = new Dictionary<int, List<int>>();
        foreach (var row in users) {
            known.Add(row[0]);
            for (int j = 1; j < row.Length; j++) {
                if (!members.TryGetValue(row[j], out var list)) members[row[j]] = list = new List<int>();
                list.Add(row[0]);
            }
        }
        var recipients = new HashSet<int>();
        var expanded = new HashSet<int>();
        foreach (var r in requests) {
            int colon = r.IndexOf(':');
            int id = int.Parse(r.Substring(colon + 1));
            if (r.StartsWith("user")) {
                if (known.Contains(id)) recipients.Add(id);
            } else if (expanded.Add(id) && members.TryGetValue(id, out var group)) {
                // Walk each group at most once: repeated group requests add nothing new.
                recipients.UnionWith(group);
            }
        }
        var result = recipients.ToArray();
        Array.Sort(result);
        return result;
    }
}
