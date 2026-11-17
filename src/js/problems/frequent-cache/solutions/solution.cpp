// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0460.LFU%20Cache/Solution.cpp
// O(1) per call: for every use count, a list of the keys with that count in recency order
// (newest first), plus the smallest count that still has keys. std::list iterators stay valid
// while other elements move, so each entry remembers where it sits in its list.
class LfuCache {
public:
    LfuCache(int capacity)
        : capacity(capacity)
        , minFreq(0) {}

    int get(int key) {
        auto it = entries.find(key);
        if (it == entries.end()) {
            return -1;
        }
        incrFreq(key, it->second);
        return it->second.value;
    }

    void put(int key, int value) {
        auto it = entries.find(key);
        if (it != entries.end()) {
            // Storing over an existing key is a use as well.
            it->second.value = value;
            incrFreq(key, it->second);
            return;
        }
        if ((int)entries.size() == capacity) {
            // The oldest key among those with the smallest count sits at the back of its list.
            auto& keys = byFreq[minFreq];
            int victim = keys.back();
            keys.pop_back();
            if (keys.empty()) {
                byFreq.erase(minFreq);
            }
            entries.erase(victim);
        }
        auto& keys = byFreq[1];
        keys.push_front(key);
        entries[key] = Entry{value, 1, keys.begin()};
        // A new key always has the smallest possible count.
        minFreq = 1;
    }

private:
    struct Entry {
        int value;
        int freq;
        list<int>::iterator pos;
    };

    int capacity;
    int minFreq;
    unordered_map<int, Entry> entries;
    unordered_map<int, list<int>> byFreq;

    void incrFreq(int key, Entry& e) {
        auto& keys = byFreq[e.freq];
        keys.erase(e.pos);
        if (keys.empty()) {
            byFreq.erase(e.freq);
            // The key was the last one with the smallest count, and it now has count + 1.
            if (minFreq == e.freq) {
                minFreq++;
            }
        }
        e.freq++;
        auto& next = byFreq[e.freq];
        next.push_front(key);
        e.pos = next.begin();
    }
};
