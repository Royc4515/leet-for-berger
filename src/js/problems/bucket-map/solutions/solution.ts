// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
const BITS = 17;

class MyHashMap {
  // Each bucket holds its keys and values in two parallel arrays, created on first use.
  private keys: (number[] | null)[] = new Array(1 << BITS).fill(null);
  private values: (number[] | null)[] = new Array(1 << BITS).fill(null);

  constructor() {}

  /** Multiplicative hashing: the top bits of the product depend on every bit of the key. */
  private index(key: number): number {
    return Math.imul(key, 0x9e3779b1) >>> (32 - BITS);
  }

  put(key: number, value: number): void {
    const i = this.index(key);
    let ks = this.keys[i];
    let vs = this.values[i];
    if (ks === null || vs === null) {
      ks = this.keys[i] = [];
      vs = this.values[i] = [];
    }
    const j = ks.indexOf(key);
    // Update in place: appending a second pair would leave a stale copy behind.
    if (j >= 0) vs[j] = value;
    else {
      ks.push(key);
      vs.push(value);
    }
  }

  get(key: number): number {
    const i = this.index(key);
    const ks = this.keys[i];
    const j = ks === null ? -1 : ks.indexOf(key);
    return j >= 0 ? this.values[i]![j] : -1;
  }

  remove(key: number): void {
    const i = this.index(key);
    const ks = this.keys[i];
    const vs = this.values[i];
    if (ks === null || vs === null) return;
    const j = ks.indexOf(key);
    if (j < 0) return;
    // Order inside a bucket does not matter: move the last pair into the gap.
    ks[j] = ks[ks.length - 1];
    vs[j] = vs[vs.length - 1];
    ks.pop();
    vs.pop();
  }
}
