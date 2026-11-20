class Solution {
    vector<int> parent;

    // Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

public:
    // Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
    vector<int> backupStations(int c, vector<vector<int>>& links, vector<vector<int>>& queries) {
        parent.resize(c);
        iota(parent.begin(), parent.end(), 0);
        for (auto& l : links) parent[find(l[0] - 1)] = find(l[1] - 1);

        // The stations of the grid with root r sit in order[start[r] .. start[r + 1]), increasing:
        // visiting ids ascending while filling keeps each group sorted.
        vector<int> root(c), start(c + 1, 0);
        for (int i = 0; i < c; i++) {
            root[i] = find(i);
            start[root[i] + 1]++;
        }
        for (int i = 0; i < c; i++) start[i + 1] += start[i];
        vector<int> fill(start.begin(), start.begin() + c), order(c);
        for (int i = 0; i < c; i++) order[fill[root[i]]++] = i;
        vector<int> ptr(start.begin(), start.begin() + c);
        vector<char> online(c, 1);

        vector<int> answers;
        for (auto& q : queries) {
            int x = q[1] - 1;
            if (q[0] == 2) {
                online[x] = 0;
            } else if (online[x]) {
                answers.push_back(q[1]);
            } else {
                int r = root[x];
                // A station never comes back online, so the pointer only moves forward: every
                // station is skipped at most once over the whole run.
                while (ptr[r] < start[r + 1] && !online[order[ptr[r]]]) ptr[r]++;
                answers.push_back(ptr[r] < start[r + 1] ? order[ptr[r]] + 1 : -1);
            }
        }
        return answers;
    }
};
