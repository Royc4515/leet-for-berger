public class Solution {
    // O(n * L^2) time, O(n * L) space. Short words first, so every predecessor (one letter
    // shorter) already holds its final chain length when a word looks it up.
    public int LongestChain(string[] words) {
        var sorted = words.OrderBy(w => w.Length).ToArray();
        var best = new Dictionary<string, int>();
        int answer = 0;
        foreach (var w in sorted) {
            // Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
            int here = 1;
            for (int i = 0; i < w.Length; i++) {
                if (best.TryGetValue(w.Remove(i, 1), out int prev)) here = Math.Max(here, prev + 1);
            }
            best[w] = here;
            answer = Math.Max(answer, here);
        }
        return answer;
    }
}
