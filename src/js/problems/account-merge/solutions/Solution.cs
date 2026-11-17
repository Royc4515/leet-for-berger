public class Solution {
    private int[] p;
    private int[] size;

    // O(E log E) for E emails - union-find over account indexes: each email links its account
    // to the first account seen with it, which merges transitively connected accounts.
    public IList<IList<string>> AccountsMerge(string[][] accounts) {
        int n = accounts.Length;
        p = new int[n];
        size = new int[n];
        for (int i = 0; i < n; ++i) {
            p[i] = i;
            size[i] = 1;
        }
        var owner = new Dictionary<string, int>();
        for (int i = 0; i < n; ++i) {
            for (int j = 1; j < accounts[i].Length; ++j) {
                if (owner.TryGetValue(accounts[i][j], out int k)) {
                    Union(i, k);
                } else {
                    owner[accounts[i][j]] = i;
                }
            }
        }
        // Iterating the owner map visits each distinct email once, so no duplicates survive.
        var groups = new Dictionary<int, List<string>>();
        foreach (var (email, i) in owner) {
            int root = Find(i);
            if (!groups.TryGetValue(root, out var list)) {
                groups[root] = list = new List<string>();
            }
            list.Add(email);
        }
        // don't touch / C#'s default string comparison is culture-aware ("Mcafee" < "McDonald");
        // the required order is by character code, which is StringComparer.Ordinal.
        var ordinal = StringComparer.Ordinal;
        var ans = new List<IList<string>>();
        foreach (var (root, emails) in groups) {
            emails.Sort(ordinal);
            var account = new List<string> { accounts[root][0] };
            account.AddRange(emails);
            ans.Add(account);
        }
        ans.Sort((a, b) => {
            int c = ordinal.Compare(a[0], b[0]);
            return c != 0 ? c : ordinal.Compare(a[1], b[1]);
        });
        return ans;
    }

    private int Find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }

    private void Union(int a, int b) {
        int pa = Find(a), pb = Find(b);
        if (pa == pb) {
            return;
        }
        // Union by size keeps the trees shallow.
        if (size[pa] < size[pb]) {
            (pa, pb) = (pb, pa);
        }
        p[pb] = pa;
        size[pa] += size[pb];
    }
}
