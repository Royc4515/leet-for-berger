// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.java
import java.util.*;

class Solution {
    private record Item(int minute, String city, int index) {}

    // O(n + sum of g^2) time for name groups of size g, O(n) space.
    public String[] suspiciousPayments(String[] payments) {
        Map<String, List<Item>> byName = new HashMap<>();
        boolean[] flagged = new boolean[payments.length];
        for (int i = 0; i < payments.length; i++) {
            String[] e = payments[i].split(",");
            int minute = Integer.parseInt(e[1]);
            String city = e[3];
            if (Integer.parseInt(e[2]) > 1000) flagged[i] = true;
            List<Item> group = byName.computeIfAbsent(e[0], k -> new ArrayList<>());
            for (Item item : group) {
                if (!city.equals(item.city()) && Math.abs(minute - item.minute()) <= 60) {
                    // A conflict makes both records suspicious, including the one seen earlier.
                    flagged[i] = true;
                    flagged[item.index()] = true;
                }
            }
            group.add(new Item(minute, city, i));
        }
        // Flags live on positions, so identical copies stay separate and input order is kept.
        List<String> out = new ArrayList<>();
        for (int i = 0; i < payments.length; i++) if (flagged[i]) out.add(payments[i]);
        return out.toArray(new String[0]);
    }
}
