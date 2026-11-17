// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0362.Design%20Hit%20Counter/Solution.ts
// O(1) per hit, O(log n) per query: timestamps never decrease, so the array of hits is already
// sorted and the window start is one binary search away.
class HitCounter {
  private ts: number[] = [];

  constructor() {}

  hit(timestamp: number): void {
    this.ts.push(timestamp);
  }

  getHits(timestamp: number): number {
    // First index whose hit is at or after x.
    const search = (x: number) => {
      let [l, r] = [0, this.ts.length];
      while (l < r) {
        const mid = (l + r) >> 1;
        if (this.ts[mid] >= x) {
          r = mid;
        } else {
          l = mid + 1;
        }
      }
      return l;
    };
    // The window is (timestamp - 300, timestamp]: its oldest second is timestamp - 299.
    return this.ts.length - search(timestamp - 300 + 1);
  }
}
