// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
public class MyHashMap {
    private const int Bits = 17;

    private sealed class Entry {
        public readonly int Key;
        public int Value;
        public Entry Next;

        public Entry(int key, int value, Entry next) {
            Key = key;
            Value = value;
            Next = next;
        }
    }

    private readonly Entry[] buckets = new Entry[1 << Bits];

    public MyHashMap() {
    }

    // Multiplicative hashing: the top bits of the product depend on every bit of the key, so
    // multiples of 1024 do not pile into a few buckets as key % 2^17 would.
    private static int Index(int key) {
        return (int)(unchecked((uint)key * 2654435761u) >> (32 - Bits));
    }

    public void Put(int key, int value) {
        int i = Index(key);
        for (Entry e = buckets[i]; e != null; e = e.Next) {
            if (e.Key == key) {
                // Update in place: adding a second entry would leave a stale copy behind.
                e.Value = value;
                return;
            }
        }
        buckets[i] = new Entry(key, value, buckets[i]);
    }

    public int Get(int key) {
        for (Entry e = buckets[Index(key)]; e != null; e = e.Next) {
            if (e.Key == key) {
                return e.Value;
            }
        }
        return -1;
    }

    public void Remove(int key) {
        int i = Index(key);
        if (buckets[i] == null) {
            return;
        }
        if (buckets[i].Key == key) {
            buckets[i] = buckets[i].Next;
            return;
        }
        for (Entry p = buckets[i]; p.Next != null; p = p.Next) {
            if (p.Next.Key == key) {
                p.Next = p.Next.Next;
                return;
            }
        }
    }
}
