import java.util.*;

class Solution {
    private int[] parent;

    // Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    // Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
    public int[] backupStations(int c, int[][] links, int[][] queries) {
        parent = new int[c];
        for (int i = 0; i < c; i++) parent[i] = i;
        for (int[] l : links) parent[find(l[0] - 1)] = find(l[1] - 1);

        // The stations of the grid with root r sit in order[start[r] .. start[r + 1]), increasing:
        // visiting ids ascending while filling keeps each group sorted.
        int[] root = new int[c];
        int[] start = new int[c + 1];
        for (int i = 0; i < c; i++) {
            root[i] = find(i);
            start[root[i] + 1]++;
        }
        for (int i = 0; i < c; i++) start[i + 1] += start[i];
        int[] fill = Arrays.copyOf(start, c);
        int[] order = new int[c];
        for (int i = 0; i < c; i++) order[fill[root[i]]++] = i;
        int[] ptr = Arrays.copyOf(start, c);
        boolean[] online = new boolean[c];
        Arrays.fill(online, true);

        List<Integer> answers = new ArrayList<>();
        for (int[] q : queries) {
            int x = q[1] - 1;
            if (q[0] == 2) {
                online[x] = false;
            } else if (online[x]) {
                answers.add(q[1]);
            } else {
                int r = root[x];
                // A station never comes back online, so the pointer only moves forward: every
                // station is skipped at most once over the whole run.
                while (ptr[r] < start[r + 1] && !online[order[ptr[r]]]) ptr[r]++;
                answers.add(ptr[r] < start[r + 1] ? order[ptr[r]] + 1 : -1);
            }
        }
        int[] result = new int[answers.size()];
        for (int i = 0; i < result.length; i++) result[i] = answers.get(i);
        return result;
    }
}
