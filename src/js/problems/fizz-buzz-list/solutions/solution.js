/**
 * O(n) time - two independent checks build the label, so a multiple of both gets both words.
 * @param {number} n
 * @return {string[]}
 */
function fizzBuzzList(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    let label = '';
    if (i % 3 === 0) label += 'Fizz';
    if (i % 5 === 0) label += 'Buzz';
    out.push(label || String(i));
  }
  return out;
}
