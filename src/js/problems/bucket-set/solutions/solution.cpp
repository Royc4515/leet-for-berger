// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0705.Design%20HashSet/Solution.cpp
// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys; a flag per possible key would need 10^9 entries.
class MyHashSet {
public:
    MyHashSet()
        : buckets(1 << BITS) {}

    void add(int key) {
        auto& bucket = buckets[index(key)];
        for (int k : bucket) {
            // Store each key once, so a single remove really takes it out.
            if (k == key) return;
        }
        bucket.push_back(key);
    }

    void remove(int key) {
        auto& bucket = buckets[index(key)];
        for (size_t j = 0; j < bucket.size(); j++) {
            if (bucket[j] == key) {
                // Order inside a bucket does not matter: move the last key into the gap.
                bucket[j] = bucket.back();
                bucket.pop_back();
                return;
            }
        }
    }

    bool contains(int key) {
        for (int k : buckets[index(key)]) {
            if (k == key) return true;
        }
        return false;
    }

private:
    static const int BITS = 17;
    vector<vector<int>> buckets;

    // Multiplicative hashing: the top bits of the product depend on every bit of the key, so
    // multiples of 1024 do not pile into a few buckets as key % 2^17 would.
    static size_t index(int key) {
        return (uint32_t)((uint32_t)key * 2654435761u) >> (32 - BITS);
    }
};
