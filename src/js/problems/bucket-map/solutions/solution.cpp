// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
class MyHashMap {
public:
    MyHashMap()
        : buckets(1 << BITS) {}

    void put(int key, int value) {
        auto& bucket = buckets[index(key)];
        for (auto& [k, v] : bucket) {
            if (k == key) {
                // Update in place: appending a second pair would leave a stale copy behind.
                v = value;
                return;
            }
        }
        bucket.emplace_back(key, value);
    }

    int get(int key) {
        for (auto& [k, v] : buckets[index(key)]) {
            if (k == key) return v;
        }
        return -1;
    }

    void remove(int key) {
        auto& bucket = buckets[index(key)];
        for (size_t j = 0; j < bucket.size(); j++) {
            if (bucket[j].first == key) {
                // Order inside a bucket does not matter: move the last pair into the gap.
                bucket[j] = bucket.back();
                bucket.pop_back();
                return;
            }
        }
    }

private:
    static const int BITS = 17;
    vector<vector<pair<int, int>>> buckets;

    // Multiplicative hashing: the top bits of the product depend on every bit of the key, so
    // multiples of 1024 do not pile into a few buckets as key % 2^17 would.
    static size_t index(int key) {
        return (uint32_t)((uint32_t)key * 2654435761u) >> (32 - BITS);
    }
};
