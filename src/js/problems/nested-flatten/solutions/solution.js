// O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
// item is visited once over the whole run.
class NestedIterator {
  /**
   * @param {NestedInteger[]} nestedList
   */
  constructor(nestedList) {
    // Each frame is a list and the index of its next unread item.
    this.stack = [[nestedList, 0]];
  }

  /**
   * @return {number}
   */
  next() {
    this.hasNext();
    const frame = this.stack[this.stack.length - 1];
    return frame[0][frame[1]++].getInteger();
  }

  /**
   * Settles on the next integer without consuming it, so calling this twice changes nothing.
   * @return {boolean}
   */
  hasNext() {
    while (this.stack.length) {
      const frame = this.stack[this.stack.length - 1];
      const [items, i] = frame;
      if (i === items.length) {
        this.stack.pop();
        continue;
      }
      if (items[i].isInteger()) return true;
      frame[1]++;
      this.stack.push([items[i].getList(), 0]);
    }
    return false;
  }
}
