// O(1) per set, O(log n) per get: set timestamps only increase, so appending keeps each key's
// versions sorted by time and a get is one binary search.
class TimeMap {
  private store = new Map<string, { times: number[]; values: string[] }>();

  constructor() {}

  set(key: string, value: string, timestamp: number): void {
    let s = this.store.get(key);
    if (s === undefined) {
      s = { times: [], values: [] };
      this.store.set(key, s);
    }
    s.times.push(timestamp);
    s.values.push(value);
  }

  get(key: string, timestamp: number): string {
    const s = this.store.get(key);
    if (s === undefined) return '';
    // Find the first version stamped after `timestamp`; the answer is the one just before it.
    let lo = 0;
    let hi = s.times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (s.times[mid] <= timestamp) lo = mid + 1;
      else hi = mid;
    }
    return lo === 0 ? '' : s.values[lo - 1];
  }
}
