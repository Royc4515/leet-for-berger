public class Solution {
    // O(E log E) - Hierholzer's algorithm. Destinations are stored in descending order so the
    // smallest unused one is always at the end, where removing it is O(1).
    public string[] FindItinerary(string[][] tickets) {
        var g = new Dictionary<string, List<string>>();
        var sorted = (string[][])tickets.Clone();
        // Ordinal comparison: the default string comparison is culture-aware and need not
        // match plain lexicographic order.
        Array.Sort(sorted, (a, b) => string.CompareOrdinal(b[1], a[1]));
        foreach (var ticket in sorted) {
            if (!g.TryGetValue(ticket[0], out var list)) {
                list = new List<string>();
                g[ticket[0]] = list;
            }
            list.Add(ticket[1]);
        }
        // An explicit stack instead of recursion keeps the depth (up to 3 * 10^4) off the call
        // stack.
        var stack = new Stack<string>();
        stack.Push("JFK");
        var ans = new List<string>();
        while (stack.Count > 0) {
            if (g.TryGetValue(stack.Peek(), out var next) && next.Count > 0) {
                stack.Push(next[^1]);
                next.RemoveAt(next.Count - 1);
            } else {
                // No tickets left here, so this airport comes after everything still on the
                // stack: the route is built back to front.
                ans.Add(stack.Pop());
            }
        }
        ans.Reverse();
        return ans.ToArray();
    }
}
