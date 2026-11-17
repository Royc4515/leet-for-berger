// O(1) per operation: every entry remembers the minimum of the stack up to and including it.
class MinStack {
  constructor() {
    this.vals = [];
    this.mins = [];
  }

  /**
   * @param {number} val
   * @return {void}
   */
  push(val) {
    // The minimum below an entry never changes while that entry sits on the stack.
    const below = this.mins.length ? this.mins[this.mins.length - 1] : val;
    this.vals.push(val);
    this.mins.push(Math.min(val, below));
  }

  /** @return {void} */
  pop() {
    this.vals.pop();
    this.mins.pop();
  }

  /** @return {number} */
  top() {
    return this.vals[this.vals.length - 1];
  }

  /** @return {number} */
  getMin() {
    return this.mins[this.mins.length - 1];
  }
}
