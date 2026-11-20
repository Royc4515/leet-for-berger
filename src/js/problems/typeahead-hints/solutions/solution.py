from bisect import bisect_left


def suggest_names(products: list[str], search_word: str) -> list[list[str]]:
    # O(n log n + L log n): sort once, then for each typed prefix the matching names form one
    # block that starts at the first name that is not smaller than the prefix.
    products = sorted(products)
    out = []
    start = 0
    for i in range(1, len(search_word) + 1):
        prefix = search_word[:i]
        # A longer prefix keeps only a subset of the shorter one's matches, so the search can
        # begin where the previous one ended.
        start = bisect_left(products, prefix, start)
        row = []
        for name in products[start:start + 3]:
            if not name.startswith(prefix):
                break
            row.append(name)
        out.append(row)
    return out
