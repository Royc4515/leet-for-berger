class Solution {
    // O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the
    // last run needs no separate flush.
    public String squeezeRuns(String s) {
        // StringBuilder appends in amortized O(1); string concatenation would copy the result per run.
        StringBuilder sb = new StringBuilder();
        int i = 0;
        int n = s.length();
        while (i < n) {
            int j = i;
            while (j < n && s.charAt(j) == s.charAt(i)) j++;
            sb.append(s.charAt(i));
            // A length of 1 is left implicit; append(int) writes 10 or more as several digits.
            if (j - i > 1) sb.append(j - i);
            i = j;
        }
        return sb.toString();
    }
}
