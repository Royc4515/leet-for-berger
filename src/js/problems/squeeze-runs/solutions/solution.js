/**
 * O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the last
 * run needs no separate flush.
 * @param {string} s
 * @return {string}
 */
function squeezeRuns(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    out.push(s[i]);
    // A length of 1 is left implicit; String() writes 10 or more as several digits.
    if (j - i > 1) out.push(String(j - i));
    i = j;
  }
  return out.join('');
}
