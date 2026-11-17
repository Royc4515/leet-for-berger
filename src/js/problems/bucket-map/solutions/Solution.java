// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
class MyHashMap {
    private static final int BITS = 17;

    private static final class Entry {
        final int key;
        int value;
        Entry next;

        Entry(int key, int value, Entry next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private final Entry[] buckets = new Entry[1 << BITS];

    public MyHashMap() {
    }

    // Multiplicative hashing: the top bits of the product depend on every bit of the key, so
    // multiples of 1024 do not pile into a few buckets as key % 2^17 would.
    private static int index(int key) {
        return (key * 0x9E3779B1) >>> (32 - BITS);
    }

    public void put(int key, int value) {
        int i = index(key);
        for (Entry e = buckets[i]; e != null; e = e.next) {
            if (e.key == key) {
                // Update in place: adding a second entry would leave a stale copy behind.
                e.value = value;
                return;
            }
        }
        buckets[i] = new Entry(key, value, buckets[i]);
    }

    public int get(int key) {
        for (Entry e = buckets[index(key)]; e != null; e = e.next) {
            if (e.key == key) {
                return e.value;
            }
        }
        return -1;
    }

    public void remove(int key) {
        int i = index(key);
        // A placeholder in front of the chain makes removing the first entry no special case.
        Entry before = new Entry(0, 0, buckets[i]);
        for (Entry p = before; p.next != null; p = p.next) {
            if (p.next.key == key) {
                p.next = p.next.next;
                break;
            }
        }
        buckets[i] = before.next;
    }
}
