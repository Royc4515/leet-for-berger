public class Solution {
    // O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first, and a
    // dot sorts before any digit, so the answers come out in dictionary order.
    public string[] DottedQuads(string s) {
        var result = new List<string>();
        Dfs(s, 0, new List<string>(), result);
        return result.ToArray();
    }

    private void Dfs(string s, int pos, List<string> parts, List<string> result) {
        int left = 4 - parts.Count;
        int rest = s.Length - pos;
        // Each remaining part takes 1 to 3 digits; anything else is a dead end.
        if (rest < left || rest > left * 3) return;
        if (left == 0) {
            result.Add(string.Join(".", parts));
            return;
        }
        for (int len = 1; len <= 3; len++) {
            if (pos + len > s.Length) break;
            string part = s.Substring(pos, len);
            // A leading zero is allowed only for the single digit "0".
            if (len > 1 && part[0] == '0') break;
            if (int.Parse(part) > 255) break;
            parts.Add(part);
            Dfs(s, pos + len, parts, result);
            parts.RemoveAt(parts.Count - 1);
        }
    }
}
