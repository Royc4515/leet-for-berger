def number_to_words(num: int) -> str:
    # O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
    if num == 0:
        return "Zero"

    below_20 = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    scales = ["", "Thousand", "Million", "Billion"]

    def spell_chunk(n: int) -> list[str]:
        words = []
        if n >= 100:
            words.append(below_20[n // 100])
            words.append("Hundred")
            n %= 100
        if n >= 20:
            words.append(tens[n // 10])
            n %= 10
        if n > 0:
            words.append(below_20[n])
        return words

    groups = []
    scale = 0
    while num > 0:
        chunk = num % 1000
        if chunk > 0:
            words = spell_chunk(chunk)
            if scales[scale]:
                words.append(scales[scale])
            groups.append(" ".join(words))
        num //= 1000
        scale += 1
    return " ".join(reversed(groups))
