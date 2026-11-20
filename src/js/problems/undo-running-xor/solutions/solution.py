def undo_running_xor(pref: list[int]) -> list[int]:
    # O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
    arr = [pref[0]]
    for i in range(1, len(pref)):
        arr.append(pref[i] ^ pref[i - 1])
    return arr
