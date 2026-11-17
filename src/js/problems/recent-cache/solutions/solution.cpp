// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0146.LRU%20Cache/Solution.cpp
// O(1) per call: a hash map finds a key's node, and a doubly linked list keeps nodes ordered by
// last use (most recent right after head, least recent right before tail).
class LruCache {
private:
    struct Node {
        int key, val;
        Node* prev;
        Node* next;
        Node(int key, int val)
            : key(key)
            , val(val)
            , prev(nullptr)
            , next(nullptr) {}
    };

    int size;
    int capacity;
    Node* head;
    Node* tail;
    unordered_map<int, Node*> cache;

    void removeNode(Node* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }

    void addToHead(Node* node) {
        node->next = head->next;
        node->prev = head;
        head->next->prev = node;
        head->next = node;
    }

public:
    LruCache(int capacity)
        : size(0)
        , capacity(capacity) {
        // Placeholder head and tail: every real node always has both neighbours, so unlinking
        // and inserting never need null checks.
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head->next = tail;
        tail->prev = head;
    }

    ~LruCache() {
        for (Node* n = head; n;) {
            Node* next = n->next;
            delete n;
            n = next;
        }
    }

    int get(int key) {
        auto it = cache.find(key);
        if (it == cache.end()) {
            return -1;
        }
        // A successful read counts as a use, so the node moves to the front.
        Node* node = it->second;
        removeNode(node);
        addToHead(node);
        return node->val;
    }

    void put(int key, int value) {
        auto it = cache.find(key);
        if (it != cache.end()) {
            // Updating an existing key refreshes it but does not grow the cache.
            Node* node = it->second;
            removeNode(node);
            node->val = value;
            addToHead(node);
            return;
        }
        Node* node = new Node(key, value);
        cache[key] = node;
        addToHead(node);
        if (++size > capacity) {
            Node* lru = tail->prev;
            cache.erase(lru->key);
            removeNode(lru);
            delete lru;
            --size;
        }
    }
};
