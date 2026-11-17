// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0146.LRU%20Cache/Solution.cs
// O(1) per call: a hash map finds a key's node, and a doubly linked list keeps nodes ordered by
// last use (most recent right after head, least recent right before tail).
public class LruCache {
    private int size;
    private readonly int capacity;
    private readonly Dictionary<int, Node> cache = new Dictionary<int, Node>();
    // Placeholder head and tail: every real node always has both neighbours, so unlinking and
    // inserting never need null checks.
    private readonly Node head = new Node();
    private readonly Node tail = new Node();

    public LruCache(int capacity) {
        this.capacity = capacity;
        head.Next = tail;
        tail.Prev = head;
    }

    public int Get(int key) {
        if (!cache.TryGetValue(key, out Node node)) {
            return -1;
        }
        // A successful read counts as a use, so the node moves to the front.
        RemoveNode(node);
        AddToHead(node);
        return node.Val;
    }

    public void Put(int key, int value) {
        if (cache.TryGetValue(key, out Node node)) {
            // Updating an existing key refreshes it but does not grow the cache.
            RemoveNode(node);
            node.Val = value;
            AddToHead(node);
            return;
        }
        node = new Node(key, value);
        cache[key] = node;
        AddToHead(node);
        if (++size > capacity) {
            Node lru = tail.Prev;
            cache.Remove(lru.Key);
            RemoveNode(lru);
            --size;
        }
    }

    private void RemoveNode(Node node) {
        node.Prev.Next = node.Next;
        node.Next.Prev = node.Prev;
    }

    private void AddToHead(Node node) {
        node.Next = head.Next;
        node.Prev = head;
        head.Next = node;
        node.Next.Prev = node;
    }

    private class Node {
        public int Key;
        public int Val;
        public Node Prev;
        public Node Next;

        public Node() {}

        public Node(int key, int val) {
            Key = key;
            Val = val;
        }
    }
}
