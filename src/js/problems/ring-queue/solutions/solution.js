// O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
// count (instead of a tail index) tells empty from full without wasting a slot.
class RingQueue {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.data = new Array(capacity).fill(0);
    this.cap = capacity;
    this.head = 0;
    this.size = 0;
  }

  /**
   * @param {number} value
   * @return {boolean}
   */
  push(value) {
    if (this.size === this.cap) return false;
    // The next free slot is `size` steps after the front, wrapping past the end of the array.
    this.data[(this.head + this.size) % this.cap] = value;
    this.size++;
    return true;
  }

  /**
   * @return {boolean}
   */
  pop() {
    if (this.size === 0) return false;
    this.head = (this.head + 1) % this.cap;
    this.size--;
    return true;
  }

  /**
   * @return {number}
   */
  front() {
    return this.size === 0 ? -1 : this.data[this.head];
  }

  /**
   * @return {number}
   */
  back() {
    return this.size === 0 ? -1 : this.data[(this.head + this.size - 1) % this.cap];
  }

  /**
   * @return {boolean}
   */
  isEmpty() {
    return this.size === 0;
  }

  /**
   * @return {boolean}
   */
  isFull() {
    return this.size === this.cap;
  }
}
