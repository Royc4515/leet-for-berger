class Solution {
    // O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
    public String interleaveWords(String word1, String word2) {
        // The final length is known, so the builder never has to grow.
        StringBuilder out = new StringBuilder(word1.length() + word2.length());
        int common = Math.min(word1.length(), word2.length());
        for (int i = 0; i < common; i++) {
            out.append(word1.charAt(i)).append(word2.charAt(i));
        }
        // Only one of these tails is non-empty.
        out.append(word1, common, word1.length());
        out.append(word2, common, word2.length());
        return out.toString();
    }
}
