// O(total length) per call. Length framing: the decoder reads a number, then copies exactly that
// many characters, so no character inside a string ever needs escaping.
class Codec {
  constructor() {}

  encode(strs: string[]): string {
    // Build parts and join once rather than growing one string piece by piece.
    return strs.map((s) => `${s.length}#${s}`).join('');
  }

  decode(s: string): string[] {
    const out: string[] = [];
    let i = 0;
    while (i < s.length) {
      // The first '#' after i ends the length; the string itself may contain more of them.
      const j = s.indexOf('#', i);
      const size = Number(s.slice(i, j));
      out.push(s.slice(j + 1, j + 1 + size));
      // Move an index instead of slicing off the decoded prefix.
      i = j + 1 + size;
    }
    return out;
  }
}
