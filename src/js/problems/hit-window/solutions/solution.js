// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0362.Design%20Hit%20Counter/Solution.ts
// O(1) per hit, O(log n) per query: timestamps never decrease, so the array of hits is already
// sorted and the window start is one binary search away.
class HitCounter {
  constructor() {
    this.ts = [];
  }

  /**
   * @param {number} timestamp
   * @return {void}
   */
  hit(timestamp) {
    this.ts.push(timestamp);
  }

  /**
   * @param {number} timestamp
   * @return {number}
   */
  getHits(timestamp) {
    // The window is (timestamp - 300, timestamp]: its oldest second is timestamp - 299.
    const x = timestamp - 300 + 1;
    // First index whose hit is at or after x.
    let l = 0;
    let r = this.ts.length;
    while (l < r) {
      const mid = (l + r) >> 1;
      if (this.ts[mid] >= x) {
        r = mid;
      } else {
        l = mid + 1;
      }
    }
    return this.ts.length - l;
  }
}
