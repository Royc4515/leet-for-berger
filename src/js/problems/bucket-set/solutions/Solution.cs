// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys; a flag per possible key would need 10^9 entries.
public class MyHashSet {
    private const int Bits = 17;

    private sealed class Node {
        public readonly int Key;
        public Node Next;

        public Node(int key, Node next) {
            Key = key;
            Next = next;
        }
    }

    private readonly Node[] buckets = new Node[1 << Bits];

    public MyHashSet() {
    }

    // Multiplicative hashing: the top bits of the product depend on every bit of the key, so
    // multiples of 1024 do not pile into a few buckets as key % 2^17 would.
    private static int Index(int key) {
        return (int)(unchecked((uint)key * 2654435761u) >> (32 - Bits));
    }

    public void Add(int key) {
        // Store each key once, so a single remove really takes it out.
        if (Contains(key)) {
            return;
        }
        int i = Index(key);
        buckets[i] = new Node(key, buckets[i]);
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
        for (Node p = buckets[i]; p.Next != null; p = p.Next) {
            if (p.Next.Key == key) {
                p.Next = p.Next.Next;
                return;
            }
        }
    }

    public bool Contains(int key) {
        for (Node n = buckets[Index(key)]; n != null; n = n.Next) {
            if (n.Key == key) {
                return true;
            }
        }
        return false;
    }
}
