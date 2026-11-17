// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0721.Accounts%20Merge/Solution.java
import java.util.*;

class UnionFind {
    private final int[] p;
    private final int[] size;

    public UnionFind(int n) {
        p = new int[n];
        size = new int[n];
        for (int i = 0; i < n; ++i) {
            p[i] = i;
            size[i] = 1;
        }
    }

    public int find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }

    public void union(int a, int b) {
        int pa = find(a), pb = find(b);
        if (pa == pb) {
            return;
        }
        // Union by size keeps the trees shallow.
        if (size[pa] > size[pb]) {
            p[pb] = pa;
            size[pa] += size[pb];
        } else {
            p[pa] = pb;
            size[pb] += size[pa];
        }
    }
}

class Solution {
    // O(E log E) for E emails - union-find over account indexes: each email links its account
    // to the first account seen with it, which merges transitively connected accounts.
    public List<List<String>> accountsMerge(String[][] accounts) {
        int n = accounts.length;
        UnionFind uf = new UnionFind(n);
        Map<String, Integer> owner = new HashMap<>();
        for (int i = 0; i < n; ++i) {
            for (int j = 1; j < accounts[i].length; ++j) {
                Integer k = owner.putIfAbsent(accounts[i][j], i);
                if (k != null) {
                    uf.union(i, k);
                }
            }
        }
        // Iterating the owner map visits each distinct email once, so no duplicates survive.
        Map<Integer, List<String>> groups = new HashMap<>();
        for (var e : owner.entrySet()) {
            groups.computeIfAbsent(uf.find(e.getValue()), k -> new ArrayList<>()).add(e.getKey());
        }
        List<List<String>> ans = new ArrayList<>();
        for (var e : groups.entrySet()) {
            List<String> emails = e.getValue();
            // String.compareTo compares UTF-16 code units, which is the required order.
            Collections.sort(emails);
            List<String> account = new ArrayList<>();
            account.add(accounts[e.getKey()][0]);
            account.addAll(emails);
            ans.add(account);
        }
        ans.sort((a, b) -> {
            int c = a.get(0).compareTo(b.get(0));
            return c != 0 ? c : a.get(1).compareTo(b.get(1));
        });
        return ans;
    }
}
