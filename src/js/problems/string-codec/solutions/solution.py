class Codec:
    # O(total length) per call. Length framing: the decoder reads a number, then copies exactly
    # that many characters, so no character inside a string ever needs escaping.

    def __init__(self):
        pass

    def encode(self, strs: list[str]) -> str:
        # One join at the end: repeated += on a growing string can copy it every time.
        return "".join(f"{len(s)}#{s}" for s in strs)

    def decode(self, s: str) -> list[str]:
        out = []
        i = 0
        while i < len(s):
            # The first '#' after i ends the length; the string itself may contain more of them.
            j = s.index("#", i)
            size = int(s[i:j])
            out.append(s[j + 1 : j + 1 + size])
            # Move an index instead of slicing off the decoded prefix, which would be quadratic.
            i = j + 1 + size
        return out
