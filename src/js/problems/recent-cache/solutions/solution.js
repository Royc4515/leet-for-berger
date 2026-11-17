// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0146.LRU%20Cache/Solution.ts
// O(1) per call: a hash map finds a key's node, and a doubly linked list keeps nodes ordered by
// last use (most recent right after head, least recent right before tail).
class CacheNode {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LruCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.size = 0;
    this.capacity = capacity;
    // Placeholder head and tail: every real node always has both neighbours, so unlinking and
    // inserting never need null checks.
    this.head = new CacheNode(0, 0);
    this.tail = new CacheNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.cache = new Map();
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    const node = this.cache.get(key);
    if (node === undefined) {
      return -1;
    }
    // A successful read counts as a use, so the node moves to the front.
    this.removeNode(node);
    this.addToHead(node);
    return node.val;
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    const existing = this.cache.get(key);
    if (existing !== undefined) {
      // Updating an existing key refreshes it but does not grow the cache.
      this.removeNode(existing);
      existing.val = value;
      this.addToHead(existing);
      return;
    }
    const node = new CacheNode(key, value);
    this.cache.set(key, node);
    this.addToHead(node);
    if (++this.size > this.capacity) {
      const lru = this.tail.prev;
      this.cache.delete(lru.key);
      this.removeNode(lru);
      --this.size;
    }
  }

  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
}
