// O(1) per call: for every use count, a linked list of the keys with that count in recency
// order (newest first), plus the smallest count that still has keys. Each entry keeps its
// LinkedListNode, so unlinking it is O(1).
public class LfuCache {
    private sealed class Entry {
        public int Value;
        public int Count;
        public LinkedListNode<int> Pos;
    }

    private readonly int capacity;
    private readonly Dictionary<int, Entry> entries = new Dictionary<int, Entry>();
    private readonly Dictionary<int, LinkedList<int>> byCount = new Dictionary<int, LinkedList<int>>();
    private int minCount;

    public LfuCache(int capacity) {
        this.capacity = capacity;
    }

    public int Get(int key) {
        if (!entries.TryGetValue(key, out Entry e)) {
            return -1;
        }
        Touch(key, e);
        return e.Value;
    }

    public void Put(int key, int value) {
        if (entries.TryGetValue(key, out Entry e)) {
            // Storing over an existing key is a use as well.
            e.Value = value;
            Touch(key, e);
            return;
        }
        if (entries.Count == capacity) {
            // The oldest key among those with the smallest count sits at the back of its list.
            LinkedList<int> keys = byCount[minCount];
            int victim = keys.Last.Value;
            keys.RemoveLast();
            if (keys.Count == 0) {
                byCount.Remove(minCount);
            }
            entries.Remove(victim);
        }
        entries[key] = new Entry { Value = value, Count = 1, Pos = Bucket(1).AddFirst(key) };
        // A new key always has the smallest possible count.
        minCount = 1;
    }

    private void Touch(int key, Entry e) {
        LinkedList<int> keys = byCount[e.Count];
        keys.Remove(e.Pos);
        if (keys.Count == 0) {
            byCount.Remove(e.Count);
            // The key was the last one with the smallest count, and it now has count + 1.
            if (minCount == e.Count) {
                minCount++;
            }
        }
        e.Count++;
        e.Pos = Bucket(e.Count).AddFirst(key);
    }

    private LinkedList<int> Bucket(int count) {
        if (!byCount.TryGetValue(count, out LinkedList<int> keys)) {
            keys = new LinkedList<int>();
            byCount[count] = keys;
        }
        return keys;
    }
}
