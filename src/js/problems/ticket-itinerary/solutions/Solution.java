// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0332.Reconstruct%20Itinerary/Solution.java
import java.util.*;

class Solution {
    // O(E log E) - Hierholzer's algorithm. Destinations are stored in descending order so the
    // smallest unused one is always at the end, where removing it is O(1).
    public String[] findItinerary(String[][] tickets) {
        Map<String, List<String>> g = new HashMap<>();
        String[][] sorted = tickets.clone();
        Arrays.sort(sorted, (a, b) -> b[1].compareTo(a[1]));
        for (String[] ticket : sorted) {
            g.computeIfAbsent(ticket[0], k -> new ArrayList<>()).add(ticket[1]);
        }
        // An explicit stack instead of recursion keeps the depth (up to 3 * 10^4) off the call
        // stack.
        Deque<String> stack = new ArrayDeque<>();
        stack.push("JFK");
        List<String> ans = new ArrayList<>();
        while (!stack.isEmpty()) {
            List<String> next = g.get(stack.peek());
            if (next != null && !next.isEmpty()) {
                stack.push(next.remove(next.size() - 1));
            } else {
                // No tickets left here, so this airport comes after everything still on the
                // stack: the route is built back to front.
                ans.add(stack.pop());
            }
        }
        Collections.reverse(ans);
        return ans.toArray(new String[0]);
    }
}
