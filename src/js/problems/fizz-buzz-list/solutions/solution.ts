// O(n) time - two independent checks build the label, so a multiple of both gets both words.
function fizzBuzzList(n: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    let label = '';
    if (i % 3 === 0) label += 'Fizz';
    if (i % 5 === 0) label += 'Buzz';
    out.push(label || String(i));
  }
  return out;
}
