using System.Collections.Generic;

// set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
// checkpoint they were made under. Ids only grow, so each slot's list stays sorted.
public class CheckpointArray {
    private readonly Dictionary<int, List<int>> ids = new Dictionary<int, List<int>>();
    private readonly Dictionary<int, List<int>> vals = new Dictionary<int, List<int>>();
    private int taken = 0;

    public CheckpointArray(int length) {
    }

    public void Set(int index, int val) {
        if (!ids.TryGetValue(index, out var h)) {
            h = new List<int>();
            ids[index] = h;
            vals[index] = new List<int>();
        }
        var v = vals[index];
        // A second write inside the same checkpoint replaces the first one.
        if (h.Count > 0 && h[h.Count - 1] == taken) {
            v[v.Count - 1] = val;
        } else {
            h.Add(taken);
            v.Add(val);
        }
    }

    public int Snap() {
        return taken++;
    }

    public int Get(int index, int snapId) {
        if (!ids.TryGetValue(index, out var h)) return 0;
        // Find the first write made under an id > snapId; the one before it is the answer.
        int lo = 0, hi = h.Count;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (h[mid] <= snapId) lo = mid + 1;
            else hi = mid;
        }
        return lo == 0 ? 0 : vals[index][lo - 1];
    }
}
