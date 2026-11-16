/**
 * Tiny seeded PRNG (mulberry32).
 * Math.random() is not seedable, and hidden tests / bot opponents must be reproducible
 * so a failing case can be replayed exactly.
 * @param {number} seed 32-bit integer seed
 * @returns {() => number} generator in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    // don't touch / constants are the published mulberry32 ones; changing them changes every hidden test.
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
