def fizz_buzz_list(n: int) -> list[str]:
    # O(n) time - two independent checks build the label, so a multiple of both gets both words.
    out = []
    for i in range(1, n + 1):
        label = ""
        if i % 3 == 0:
            label += "Fizz"
        if i % 5 == 0:
            label += "Buzz"
        out.append(label or str(i))
    return out
