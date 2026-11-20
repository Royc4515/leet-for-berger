// O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
// count (instead of a tail index) tells empty from full without wasting a slot.
class RingQueue {
  private data: number[];
  private cap: number;
  private head = 0;
  private size = 0;

  constructor(capacity: number) {
    this.data = new Array<number>(capacity).fill(0);
    this.cap = capacity;
  }

  push(value: number): boolean {
    if (this.size === this.cap) return false;
    // The next free slot is `size` steps after the front, wrapping past the end of the array.
    this.data[(this.head + this.size) % this.cap] = value;
    this.size++;
    return true;
  }

  pop(): boolean {
    if (this.size === 0) return false;
    this.head = (this.head + 1) % this.cap;
    this.size--;
    return true;
  }

  front(): number {
    return this.size === 0 ? -1 : this.data[this.head];
  }

  back(): number {
    return this.size === 0 ? -1 : this.data[(this.head + this.size - 1) % this.cap];
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  isFull(): boolean {
    return this.size === this.cap;
  }
}
