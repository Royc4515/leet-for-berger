// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0705.Design%20HashSet/Solution.ts
// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys; a flag per possible key would need 10^9 entries.
const BITS = 17;

class MyHashSet {
  constructor() {
    // Each bucket is an array of keys, created on first use.
    this.buckets = new Array(1 << BITS).fill(null);
  }

  /** Multiplicative hashing: the top bits of the product depend on every bit of the key. */
  index(key) {
    return Math.imul(key, 0x9e3779b1) >>> (32 - BITS);
  }

  /**
   * @param {number} key
   * @return {void}
   */
  add(key) {
    const i = this.index(key);
    const bucket = this.buckets[i];
    if (bucket === null) this.buckets[i] = [key];
    // Store each key once, so a single remove really takes it out.
    else if (!bucket.includes(key)) bucket.push(key);
  }

  /**
   * @param {number} key
   * @return {void}
   */
  remove(key) {
    const bucket = this.buckets[this.index(key)];
    if (bucket === null) return;
    const j = bucket.indexOf(key);
    if (j < 0) return;
    // Order inside a bucket does not matter: move the last key into the gap.
    bucket[j] = bucket[bucket.length - 1];
    bucket.pop();
  }

  /**
   * @param {number} key
   * @return {boolean}
   */
  contains(key) {
    const bucket = this.buckets[this.index(key)];
    return bucket !== null && bucket.includes(key);
  }
}
