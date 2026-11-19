# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0705.Design%20HashSet/Solution.py
BITS = 17


class MyHashSet:
    # O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
    # 2 * 10^5 keys; a flag per possible key would need 10^9 entries.

    def __init__(self):
        # Each bucket is a list of keys, created on first use.
        self.buckets = [None] * (1 << BITS)

    @staticmethod
    def _index(key: int) -> int:
        # Multiplicative hashing: the top bits of the product depend on every bit of the key, so
        # multiples of 1024 do not pile into a few buckets as key % 2^17 would.
        return ((key * 2654435761) & 0xFFFFFFFF) >> (32 - BITS)

    def add(self, key: int) -> None:
        i = self._index(key)
        bucket = self.buckets[i]
        if bucket is None:
            self.buckets[i] = [key]
        elif key not in bucket:
            # Store each key once, so a single remove really takes it out.
            bucket.append(key)

    def remove(self, key: int) -> None:
        bucket = self.buckets[self._index(key)]
        if bucket:
            for j, k in enumerate(bucket):
                if k == key:
                    # Order inside a bucket does not matter: move the last key into the gap.
                    bucket[j] = bucket[-1]
                    bucket.pop()
                    return

    def contains(self, key: int) -> bool:
        bucket = self.buckets[self._index(key)]
        return bucket is not None and key in bucket
