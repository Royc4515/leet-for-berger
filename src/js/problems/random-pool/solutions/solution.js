// O(1) average per operation: the values sit in a dense array for uniform picks, and a map from
// value to array index makes membership and removal constant time.
class RandomizedSet {
  constructor() {
    this.values = [];
    this.index = new Map();
  }

  /**
   * @param {number} val
   * @return {boolean}
   */
  insert(val) {
    if (this.index.has(val)) return false;
    this.index.set(val, this.values.length);
    this.values.push(val);
    return true;
  }

  /**
   * @param {number} val
   * @return {boolean}
   */
  remove(val) {
    const i = this.index.get(val);
    if (i === undefined) return false;
    this.index.delete(val);
    // Order does not matter, so the last value fills the hole and the array stays dense.
    const last = this.values.pop();
    if (i < this.values.length) {
      this.values[i] = last;
      this.index.set(last, i);
    }
    return true;
  }

  /**
   * @return {number}
   */
  getRandom() {
    return this.values[Math.floor(Math.random() * this.values.length)];
  }
}
