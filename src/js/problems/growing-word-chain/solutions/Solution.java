import java.util.*;

class Solution {
    // O(n * L^2) time, O(n * L) space. Short words first, so every predecessor (one letter
    // shorter) already holds its final chain length when a word looks it up.
    public int longestChain(String[] words) {
        String[] sorted = words.clone();
        Arrays.sort(sorted, Comparator.comparingInt(String::length));
        Map<String, Integer> best = new HashMap<>();
        int answer = 0;
        for (String w : sorted) {
            // Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
            int here = 1;
            for (int i = 0; i < w.length(); i++) {
                String prev = w.substring(0, i) + w.substring(i + 1);
                here = Math.max(here, best.getOrDefault(prev, 0) + 1);
            }
            best.put(w, here);
            answer = Math.max(answer, here);
        }
        return answer;
    }
}
