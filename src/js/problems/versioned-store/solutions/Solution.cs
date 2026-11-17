// O(1) per set, O(log n) per get: set timestamps only increase, so appending keeps each key's
// versions sorted by time and a get is one binary search.
public class TimeMap {
    private sealed class Versions {
        public readonly List<int> Times = new List<int>();
        public readonly List<string> Values = new List<string>();
    }

    // The default string comparer is ordinal, so keys match byte for byte.
    private readonly Dictionary<string, Versions> store = new Dictionary<string, Versions>();

    public TimeMap() {
    }

    public void Set(string key, string value, int timestamp) {
        if (!store.TryGetValue(key, out Versions v)) {
            v = new Versions();
            store[key] = v;
        }
        v.Times.Add(timestamp);
        v.Values.Add(value);
    }

    public string Get(string key, int timestamp) {
        if (!store.TryGetValue(key, out Versions v)) {
            return "";
        }
        // The first version stamped after `timestamp`; the answer is the one just before it.
        int lo = 0, hi = v.Times.Count;
        while (lo < hi) {
            int mid = (lo + hi) >> 1;
            if (v.Times[mid] <= timestamp) lo = mid + 1;
            else hi = mid;
        }
        return lo == 0 ? "" : v.Values[lo - 1];
    }
}
