import java.util.*;

class Solution {
    // O(n log n) - sweep the edges left to right with a max-heap of the buildings already
    // started, as {height, right}. Finished buildings are removed lazily, only when they reach
    // the top: the top is all that matters, and PriorityQueue.remove(Object) would be O(n).
    public int[][] getSkyline(int[][] buildings) {
        int n = buildings.length;
        int[] lines = new int[2 * n];
        for (int i = 0; i < n; ++i) {
            lines[2 * i] = buildings[i][0];
            lines[2 * i + 1] = buildings[i][1];
        }
        Arrays.sort(lines);
        // Integer.compare, not subtraction: heights near 2^31 would overflow.
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(b[0], a[0]));
        List<int[]> skys = new ArrayList<>();
        int city = 0;
        for (int line : lines) {
            while (city < n && buildings[city][0] <= line) {
                pq.add(new int[] {buildings[city][2], buildings[city][1]});
                ++city;
            }
            while (!pq.isEmpty() && pq.peek()[1] <= line) {
                pq.poll();
            }
            int high = pq.isEmpty() ? 0 : pq.peek()[0];
            // Only a change of height is a key point; a repeated x gives the same height again.
            if (!skys.isEmpty() && skys.get(skys.size() - 1)[1] == high) {
                continue;
            }
            skys.add(new int[] {line, high});
        }
        return skys.toArray(new int[0][]);
    }
}
