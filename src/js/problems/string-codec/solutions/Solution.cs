// O(total length) per call. Length framing: the decoder reads a number, then copies exactly that
// many characters, so no character inside a string ever needs escaping.
public class Codec {
    public Codec() {
    }

    public string Encode(string[] strs) {
        // One StringBuilder: concatenating strings in a loop copies the whole prefix every time.
        var sb = new System.Text.StringBuilder();
        foreach (var s in strs) sb.Append(s.Length).Append('#').Append(s);
        return sb.ToString();
    }

    public string[] Decode(string s) {
        var output = new List<string>();
        int i = 0;
        while (i < s.Length) {
            // The first '#' after i ends the length; the string itself may contain more of them.
            int j = s.IndexOf('#', i);
            int size = int.Parse(s.AsSpan(i, j - i), System.Globalization.CultureInfo.InvariantCulture);
            output.Add(s.Substring(j + 1, size));
            // Move an index instead of cutting off the decoded prefix.
            i = j + 1 + size;
        }
        return output.ToArray();
    }
}
