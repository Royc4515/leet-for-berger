// O(1) per call: for every use count, a circular doubly linked list of the nodes with that count
// in recency order (newest right after the list's placeholder), plus the smallest count that
// still has nodes. A Map per count in insertion order looks simpler, but V8 keeps deleted
// entries until it rehashes, so reading the first key after many deletions is not O(1).
interface LfuNode {
  key: number;
  value: number;
  count: number;
  prev: LfuNode;
  next: LfuNode;
}

class LfuCache {
  private capacity: number;
  private nodes = new Map<number, LfuNode>();
  private lists = new Map<number, LfuNode>(); // count -> placeholder node of that count's list
  private minCount = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    const node = this.nodes.get(key);
    if (node === undefined) return -1;
    this.touch(node);
    return node.value;
  }

  put(key: number, value: number): void {
    const node = this.nodes.get(key);
    if (node !== undefined) {
      // Storing over an existing key is a use as well.
      node.value = value;
      this.touch(node);
      return;
    }
    if (this.nodes.size === this.capacity) {
      // The oldest node among those with the smallest count is the last one in its list.
      const victim = this.lists.get(this.minCount)!.prev;
      this.unlink(victim);
      this.nodes.delete(victim.key);
    }
    const fresh = { key, value, count: 1 } as LfuNode;
    this.nodes.set(key, fresh);
    this.pushFront(fresh);
    // A new key always has the smallest possible count.
    this.minCount = 1;
  }

  private touch(node: LfuNode): void {
    this.unlink(node);
    const head = this.lists.get(node.count)!;
    // The node was the last one with the smallest count, and it now has count + 1.
    if (this.minCount === node.count && head.next === head) this.minCount++;
    node.count++;
    this.pushFront(node);
  }

  private unlink(node: LfuNode): void {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  private pushFront(node: LfuNode): void {
    let head = this.lists.get(node.count);
    if (head === undefined) {
      // A placeholder that points to itself is an empty circular list.
      const h = { key: -1, value: -1, count: node.count } as LfuNode;
      h.prev = h.next = h;
      this.lists.set(node.count, h);
      head = h;
    }
    node.next = head.next;
    node.prev = head;
    head.next.prev = node;
    head.next = node;
  }
}
