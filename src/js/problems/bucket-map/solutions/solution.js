// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
const BITS = 17;

class MyHashMap {
  constructor() {
    // Each bucket holds its keys and values in two parallel arrays, created on first use.
    this.keys = new Array(1 << BITS).fill(null);
    this.values = new Array(1 << BITS).fill(null);
  }

  /** Multiplicative hashing: the top bits of the product depend on every bit of the key. */
  index(key) {
    return Math.imul(key, 0x9e3779b1) >>> (32 - BITS);
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    const i = this.index(key);
    if (this.keys[i] === null) {
      this.keys[i] = [];
      this.values[i] = [];
    }
    const j = this.keys[i].indexOf(key);
    // Update in place: appending a second pair would leave a stale copy behind.
    if (j >= 0) this.values[i][j] = value;
    else {
      this.keys[i].push(key);
      this.values[i].push(value);
    }
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    const i = this.index(key);
    const j = this.keys[i] === null ? -1 : this.keys[i].indexOf(key);
    return j >= 0 ? this.values[i][j] : -1;
  }

  /**
   * @param {number} key
   * @return {void}
   */
  remove(key) {
    const i = this.index(key);
    const ks = this.keys[i];
    if (ks === null) return;
    const j = ks.indexOf(key);
    if (j < 0) return;
    // Order inside a bucket does not matter: move the last pair into the gap.
    const vs = this.values[i];
    ks[j] = ks[ks.length - 1];
    vs[j] = vs[vs.length - 1];
    ks.pop();
    vs.pop();
  }
}
