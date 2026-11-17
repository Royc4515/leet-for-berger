// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0900-0999/0981.Time%20Based%20Key-Value%20Store/Solution.java
import java.util.*;

// O(1) amortized per set, O(log n) per get: set timestamps only increase, so appending keeps
// each key's versions sorted by time and a get is one binary search. Plain int arrays avoid
// boxing every timestamp, as a TreeMap<Integer, String> would.
class TimeMap {
    private static final class Versions {
        int[] times = new int[4];
        String[] values = new String[4];
        int size;
    }

    private final Map<String, Versions> ktv = new HashMap<>();

    public TimeMap() {
    }

    public void set(String key, String value, int timestamp) {
        Versions v = ktv.computeIfAbsent(key, k -> new Versions());
        if (v.size == v.times.length) {
            v.times = Arrays.copyOf(v.times, v.size * 2);
            v.values = Arrays.copyOf(v.values, v.size * 2);
        }
        v.times[v.size] = timestamp;
        v.values[v.size] = value;
        v.size++;
    }

    public String get(String key, int timestamp) {
        Versions v = ktv.get(key);
        if (v == null) {
            return "";
        }
        // The first version stamped after `timestamp`; the answer is the one just before it.
        int lo = 0, hi = v.size;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (v.times[mid] <= timestamp) lo = mid + 1;
            else hi = mid;
        }
        return lo == 0 ? "" : v.values[lo - 1];
    }
}
