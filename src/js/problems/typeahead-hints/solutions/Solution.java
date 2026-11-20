import java.util.*;

class Solution {
    // O(n log n + L log n): sort once, then for each typed prefix the matching names form one
    // block that starts at the first name that is not smaller than the prefix.
    public List<List<String>> suggestNames(String[] products, String searchWord) {
        String[] sorted = products.clone();
        Arrays.sort(sorted);
        List<List<String>> out = new ArrayList<>();
        int start = 0;
        for (int i = 1; i <= searchWord.length(); i++) {
            String prefix = searchWord.substring(0, i);
            // A longer prefix keeps only a subset of the shorter one's matches, so the search
            // can begin where the previous one ended.
            int low = start;
            int high = sorted.length;
            while (low < high) {
                int mid = (low + high) >>> 1;
                if (sorted[mid].compareTo(prefix) < 0) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
            start = low;
            List<String> row = new ArrayList<>();
            for (int j = start; j < sorted.length && row.size() < 3 && sorted[j].startsWith(prefix); j++) {
                row.add(sorted[j]);
            }
            out.add(row);
        }
        return out;
    }
}
