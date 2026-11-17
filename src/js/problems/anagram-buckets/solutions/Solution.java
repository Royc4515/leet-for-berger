import java.util.*;

class Solution {
    // O(n * k log k) time - the sorted letters are the same key for every anagram.
    public List<List<String>> groupAnagrams(String[] words) {
        // LinkedHashMap keeps insertion order, which gives first-appearance group order.
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String w : words) {
            char[] letters = w.toCharArray();
            Arrays.sort(letters);
            groups.computeIfAbsent(new String(letters), k -> new ArrayList<>()).add(w);
        }
        return new ArrayList<>(groups.values());
    }
}
