public class Solution {
    // O(n log n) - sweep the edges left to right with a max-heap of the buildings already
    // started. Finished buildings are removed lazily, only when they reach the top: the top is
    // all that matters, and searching the heap for them would be O(n).
    public int[][] GetSkyline(int[][] buildings) {
        int n = buildings.Length;
        var lines = new int[2 * n];
        for (int i = 0; i < n; ++i) {
            lines[2 * i] = buildings[i][0];
            lines[2 * i + 1] = buildings[i][1];
        }
        Array.Sort(lines);
        // PriorityQueue is a min-heap, so the priority is the negated height (no overflow:
        // heights are positive ints).
        var pq = new PriorityQueue<(int Height, int Right), int>();
        var skys = new List<int[]>();
        int city = 0;
        foreach (int line in lines) {
            while (city < n && buildings[city][0] <= line) {
                pq.Enqueue((buildings[city][2], buildings[city][1]), -buildings[city][2]);
                ++city;
            }
            while (pq.Count > 0 && pq.Peek().Right <= line) {
                pq.Dequeue();
            }
            int high = pq.Count == 0 ? 0 : pq.Peek().Height;
            // Only a change of height is a key point; a repeated x gives the same height again.
            if (skys.Count > 0 && skys[^1][1] == high) {
                continue;
            }
            skys.Add(new[] { line, high });
        }
        return skys.ToArray();
    }
}
