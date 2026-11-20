def unfold_brackets(s: str) -> str:
    # O(n + m) time for input length n and output length m: one shared buffer, and a closing
    # bracket repeats only the slice written since its opening bracket.
    out = []
    stack = []  # (position in out where the group starts, repeat count)
    k = 0
    for ch in s:
        if ch.isdigit():
            # Counts can have several digits.
            k = k * 10 + int(ch)
        elif ch == "[":
            stack.append((len(out), k))
            k = 0
        elif ch == "]":
            start, times = stack.pop()
            # The group is already in the buffer once, so add times - 1 more copies.
            out.extend(out[start:] * (times - 1))
        else:
            out.append(ch)
    return "".join(out)
