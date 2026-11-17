// O(m + n) time - concatenation test, then the gcd-length prefix.
function gcdOfStrings(str1: string, str2: string): string {
  // If both strings repeat the same x, gluing them in either order gives the same string;
  // if they do not, some position disagrees.
  if (str1 + str2 !== str2 + str1) return '';
  let a = str1.length;
  let b = str2.length;
  while (b) [a, b] = [b, a % b];
  // Any common divisor's length divides both lengths, and the gcd-length prefix is one of them.
  return str1.slice(0, a);
}
