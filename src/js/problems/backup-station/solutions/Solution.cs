public class Solution {
    private int[] parent;

    // Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
    private int Find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    // Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
    public int[] BackupStations(int c, int[][] links, int[][] queries) {
        parent = new int[c];
        for (int i = 0; i < c; i++) parent[i] = i;
        foreach (int[] l in links) parent[Find(l[0] - 1)] = Find(l[1] - 1);

        // The stations of the grid with root r sit in order[start[r] .. start[r + 1]), increasing:
        // visiting ids ascending while filling keeps each group sorted.
        var root = new int[c];
        var start = new int[c + 1];
        for (int i = 0; i < c; i++) {
            root[i] = Find(i);
            start[root[i] + 1]++;
        }
        for (int i = 0; i < c; i++) start[i + 1] += start[i];
        var fill = new int[c];
        Array.Copy(start, fill, c);
        var order = new int[c];
        for (int i = 0; i < c; i++) order[fill[root[i]]++] = i;
        var ptr = new int[c];
        Array.Copy(start, ptr, c);
        var online = new bool[c];
        Array.Fill(online, true);

        var answers = new List<int>();
        foreach (int[] q in queries) {
            int x = q[1] - 1;
            if (q[0] == 2) {
                online[x] = false;
            } else if (online[x]) {
                answers.Add(q[1]);
            } else {
                int r = root[x];
                // A station never comes back online, so the pointer only moves forward: every
                // station is skipped at most once over the whole run.
                while (ptr[r] < start[r + 1] && !online[order[ptr[r]]]) ptr[r]++;
                answers.Add(ptr[r] < start[r + 1] ? order[ptr[r]] + 1 : -1);
            }
        }
        return answers.ToArray();
    }
}
