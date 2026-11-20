public class Solution {
    // O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
    public string InterleaveWords(string word1, string word2) {
        // The final length is known, so the builder never has to grow.
        var woven = new System.Text.StringBuilder(word1.Length + word2.Length);
        int common = System.Math.Min(word1.Length, word2.Length);
        for (int i = 0; i < common; i++) {
            woven.Append(word1[i]).Append(word2[i]);
        }
        // Only one of these tails is non-empty.
        woven.Append(word1, common, word1.Length - common);
        woven.Append(word2, common, word2.Length - common);
        return woven.ToString();
    }
}
