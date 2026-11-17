BITS = 17


class MyHashMap:
    # O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
    # 2 * 10^5 keys.

    def __init__(self):
        # Each bucket is a list of [key, value] pairs; buckets are created on first use.
        self.buckets = [None] * (1 << BITS)

    @staticmethod
    def _index(key: int) -> int:
        # Multiplicative hashing: the top bits of key * (golden ratio * 2^32) depend on every bit
        # of the key, so multiples of 1024 do not pile into a few buckets as key % 2^17 would.
        return ((key * 2654435761) & 0xFFFFFFFF) >> (32 - BITS)

    def put(self, key: int, value: int) -> None:
        i = self._index(key)
        bucket = self.buckets[i]
        if bucket is None:
            self.buckets[i] = [[key, value]]
            return
        for pair in bucket:
            if pair[0] == key:
                # Update in place: appending a second pair would leave a stale copy behind.
                pair[1] = value
                return
        bucket.append([key, value])

    def get(self, key: int) -> int:
        bucket = self.buckets[self._index(key)]
        if bucket:
            for k, v in bucket:
                if k == key:
                    return v
        return -1

    def remove(self, key: int) -> None:
        bucket = self.buckets[self._index(key)]
        if bucket:
            for j, pair in enumerate(bucket):
                if pair[0] == key:
                    # Order inside a bucket does not matter: move the last pair into the gap.
                    bucket[j] = bucket[-1]
                    bucket.pop()
                    return
