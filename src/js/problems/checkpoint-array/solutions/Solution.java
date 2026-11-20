import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
// checkpoint they were made under. Ids only grow, so each slot's list stays sorted.
class CheckpointArray {
    private final Map<Integer, List<int[]>> history = new HashMap<>(); // slot -> [checkpoint id, value]
    private int taken = 0;

    public CheckpointArray(int length) {
    }

    public void set(int index, int val) {
        List<int[]> h = history.computeIfAbsent(index, k -> new ArrayList<>());
        // A second write inside the same checkpoint replaces the first one.
        if (!h.isEmpty() && h.get(h.size() - 1)[0] == taken) {
            h.get(h.size() - 1)[1] = val;
        } else {
            h.add(new int[] {taken, val});
        }
    }

    public int snap() {
        return taken++;
    }

    public int get(int index, int snapId) {
        List<int[]> h = history.get(index);
        if (h == null) return 0;
        // Find the first write made under an id > snapId; the one before it is the answer.
        int lo = 0;
        int hi = h.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (h.get(mid)[0] <= snapId) lo = mid + 1;
            else hi = mid;
        }
        return lo == 0 ? 0 : h.get(lo - 1)[1];
    }
}
