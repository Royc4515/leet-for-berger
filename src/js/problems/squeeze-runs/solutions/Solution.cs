public class Solution {
    // O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the
    // last run needs no separate flush.
    public string SqueezeRuns(string s) {
        // StringBuilder appends in amortized O(1); string concatenation would copy the result per run.
        var sb = new System.Text.StringBuilder();
        int i = 0;
        int n = s.Length;
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            sb.Append(s[i]);
            // A length of 1 is left implicit; Append(int) writes 10 or more as several digits.
            if (j - i > 1) sb.Append(j - i);
            i = j;
        }
        return sb.ToString();
    }
}
