// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.java
public class Solution {
    // O(n + sum of g^2) time for name groups of size g, O(n) space.
    public string[] SuspiciousPayments(string[] payments) {
        var byName = new Dictionary<string, List<(int Minute, string City, int Index)>>();
        var flagged = new bool[payments.Length];
        for (int i = 0; i < payments.Length; i++) {
            var e = payments[i].Split(',');
            int minute = int.Parse(e[1]);
            string city = e[3];
            if (int.Parse(e[2]) > 1000) flagged[i] = true;
            if (!byName.TryGetValue(e[0], out var group)) byName[e[0]] = group = new List<(int, string, int)>();
            foreach (var item in group) {
                if (item.City != city && Math.Abs(minute - item.Minute) <= 60) {
                    // A conflict makes both records suspicious, including the one seen earlier.
                    flagged[i] = true;
                    flagged[item.Index] = true;
                }
            }
            group.Add((minute, city, i));
        }
        // Flags live on positions, so identical copies stay separate and input order is kept.
        var result = new List<string>();
        for (int i = 0; i < payments.Length; i++) if (flagged[i]) result.Add(payments[i]);
        return result.ToArray();
    }
}
