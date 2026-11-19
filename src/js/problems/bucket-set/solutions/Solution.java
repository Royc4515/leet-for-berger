// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0705.Design%20HashSet/Solution.java
// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys; a flag per possible key would need 10^9 entries.
class MyHashSet {
    private static final int BITS = 17;

    private static final class Node {
        final int key;
        Node next;

        Node(int key, Node next) {
            this.key = key;
            this.next = next;
        }
    }

    private final Node[] buckets = new Node[1 << BITS];

    public MyHashSet() {
    }

    // Multiplicative hashing: the top bits of the product depend on every bit of the key, so
    // multiples of 1024 do not pile into a few buckets as key % 2^17 would.
    private static int index(int key) {
        return (key * 0x9E3779B1) >>> (32 - BITS);
    }

    public void add(int key) {
        // Store each key once, so a single remove really takes it out.
        if (contains(key)) {
            return;
        }
        int i = index(key);
        buckets[i] = new Node(key, buckets[i]);
    }

    public void remove(int key) {
        int i = index(key);
        // A placeholder in front of the chain makes removing the first node no special case.
        Node before = new Node(0, buckets[i]);
        for (Node p = before; p.next != null; p = p.next) {
            if (p.next.key == key) {
                p.next = p.next.next;
                break;
            }
        }
        buckets[i] = before.next;
    }

    public boolean contains(int key) {
        for (Node n = buckets[index(key)]; n != null; n = n.next) {
            if (n.key == key) {
                return true;
            }
        }
        return false;
    }
}
