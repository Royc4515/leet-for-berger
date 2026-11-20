import java.util.*;

class Solution {
    // O(n * L) hash lookups for text length n and longest word L: reach[i] says the first i
    // characters split cleanly.
    public boolean canSplit(String text, String[] words) {
        Set<String> dictionary = new HashSet<>(Arrays.asList(words));
        // Only lengths that occur in the dictionary can end a piece, so at most 20 probes per position.
        TreeSet<Integer> lengths = new TreeSet<>();
        for (String w : words) {
            lengths.add(w.length());
        }
        int n = text.length();
        boolean[] reach = new boolean[n + 1];
        reach[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int length : lengths) {
                if (length > i) {
                    break;
                }
                if (reach[i - length] && dictionary.contains(text.substring(i - length, i))) {
                    reach[i] = true;
                    break;
                }
            }
        }
        return reach[n];
    }
}
