// O(1) per call: for every use count, a circular doubly linked list of the nodes with that count
// in recency order (newest right after the list's placeholder), plus the smallest count that
// still has nodes. A Map per count in insertion order looks simpler, but V8 keeps deleted
// entries until it rehashes, so reading the first key after many deletions is not O(1).
class LfuCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.nodes = new Map(); // key -> node
    this.lists = new Map(); // count -> placeholder node of that count's list
    this.minCount = 0;
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    const node = this.nodes.get(key);
    if (node === undefined) return -1;
    this.touch(node);
    return node.value;
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    const node = this.nodes.get(key);
    if (node !== undefined) {
      // Storing over an existing key is a use as well.
      node.value = value;
      this.touch(node);
      return;
    }
    if (this.nodes.size === this.capacity) {
      // The oldest node among those with the smallest count is the last one in its list.
      const victim = this.lists.get(this.minCount).prev;
      this.unlink(victim);
      this.nodes.delete(victim.key);
    }
    const fresh = { key, value, count: 1, prev: null, next: null };
    this.nodes.set(key, fresh);
    this.pushFront(fresh);
    // A new key always has the smallest possible count.
    this.minCount = 1;
  }

  touch(node) {
    this.unlink(node);
    const head = this.lists.get(node.count);
    // The node was the last one with the smallest count, and it now has count + 1.
    if (this.minCount === node.count && head.next === head) this.minCount++;
    node.count++;
    this.pushFront(node);
  }

  unlink(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  pushFront(node) {
    let head = this.lists.get(node.count);
    if (head === undefined) {
      // A placeholder that points to itself is an empty circular list.
      head = { prev: null, next: null };
      head.prev = head.next = head;
      this.lists.set(node.count, head);
    }
    node.next = head.next;
    node.prev = head;
    head.next.prev = node;
    head.next = node;
  }
}
