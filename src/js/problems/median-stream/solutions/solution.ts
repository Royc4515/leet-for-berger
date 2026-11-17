// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/Solution.ts
// O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.

/** Binary heap; `before(a, b)` is true when a belongs closer to the top than b. */
class Heap {
  private a: number[] = [];

  constructor(private before: (x: number, y: number) => boolean) {}

  size(): number {
    return this.a.length;
  }

  top(): number {
    return this.a[0];
  }

  push(v: number): void {
    const a = this.a;
    a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.before(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop(): number {
    const a = this.a;
    const top = a[0];
    const last = a.pop() as number;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.before(a[l], a[m])) m = l;
        if (r < a.length && this.before(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}

class MedianFinder {
  private low = new Heap((x, y) => x > y);
  private high = new Heap((x, y) => x < y);

  addNum(num: number): void {
    // Route the number through the smaller half first, so the largest of it moves up and the
    // halves stay ordered whatever value arrives.
    this.low.push(num);
    this.high.push(this.low.pop());
    // Keep the smaller half the same size or one larger, so its top is the odd-count median.
    if (this.high.size() > this.low.size()) this.low.push(this.high.pop());
  }

  findMedian(): number {
    // Sums of two 32-bit values stay far below 2^53, so plain numbers are exact here.
    if (this.low.size() > this.high.size()) return 2 * this.low.top();
    return this.low.top() + this.high.top();
  }
}
