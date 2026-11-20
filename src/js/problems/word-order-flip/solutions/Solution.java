class Solution {
    // O(n) time: walk from the right end so the words come out already in reverse order. Skipping
    // every space before a word drops leading, trailing and repeated spaces in one move.
    public String flipWordOrder(String s) {
        // StringBuilder appends in amortized O(1); String concatenation would copy the answer per word.
        StringBuilder out = new StringBuilder();
        int i = s.length() - 1;
        while (i >= 0) {
            while (i >= 0 && s.charAt(i) == ' ') i--;
            if (i < 0) break;
            int end = i;
            while (i >= 0 && s.charAt(i) != ' ') i--;
            if (out.length() > 0) out.append(' ');
            out.append(s, i + 1, end + 1);
        }
        return out.toString();
    }
}
