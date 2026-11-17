import java.util.*;

class Solution {
    // O(M + R + K log K) time, O(M + K) space - index groups once.
    public int[] notifyRecipients(int[][] users, String[] requests) {
        Set<Integer> known = new HashSet<>();
        Map<Integer, List<Integer>> members = new HashMap<>();
        for (int[] row : users) {
            known.add(row[0]);
            for (int j = 1; j < row.length; j++) {
                members.computeIfAbsent(row[j], k -> new ArrayList<>()).add(row[0]);
            }
        }
        Set<Integer> out = new HashSet<>();
        Set<Integer> expanded = new HashSet<>();
        for (String r : requests) {
            int colon = r.indexOf(':');
            String kind = r.substring(0, colon);
            int id = Integer.parseInt(r.substring(colon + 1));
            if (kind.equals("user")) {
                if (known.contains(id)) out.add(id);
            } else if (expanded.add(id)) {
                // Walk each group at most once: repeated group requests add nothing new.
                out.addAll(members.getOrDefault(id, Collections.emptyList()));
            }
        }
        return out.stream().mapToInt(Integer::intValue).sorted().toArray();
    }
}
