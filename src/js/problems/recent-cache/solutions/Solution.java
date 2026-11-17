// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0146.LRU%20Cache/Solution.java
import java.util.*;

// O(1) per call: a hash map finds a key's node, and a doubly linked list keeps nodes ordered by
// last use (most recent right after head, least recent right before tail).
class LruCache {
    private static final class Node {
        int key, val;
        Node prev, next;

        Node(int key, int val) {
            this.key = key;
            this.val = val;
        }
    }

    private int size;
    private final int capacity;
    // Placeholder head and tail: every real node always has both neighbours, so unlinking and
    // inserting never need null checks.
    private final Node head = new Node(0, 0);
    private final Node tail = new Node(0, 0);
    private final Map<Integer, Node> cache = new HashMap<>();

    public LruCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node node = cache.get(key);
        if (node == null) {
            return -1;
        }
        // A successful read counts as a use, so the node moves to the front.
        removeNode(node);
        addToHead(node);
        return node.val;
    }

    public void put(int key, int value) {
        Node node = cache.get(key);
        if (node != null) {
            // Updating an existing key refreshes it but does not grow the cache.
            removeNode(node);
            node.val = value;
            addToHead(node);
            return;
        }
        node = new Node(key, value);
        cache.put(key, node);
        addToHead(node);
        if (++size > capacity) {
            Node lru = tail.prev;
            cache.remove(lru.key);
            removeNode(lru);
            --size;
        }
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void addToHead(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next = node;
        node.next.prev = node;
    }
}
