// O(1) average per operation: the values sit in a dense array for uniform picks, and a map from
// value to array index makes membership and removal constant time.
class RandomizedSet {
public:
    RandomizedSet() : rng(random_device{}()) {
    }

    bool insert(int val) {
        if (index.count(val)) return false;
        index[val] = values.size();
        values.push_back(val);
        return true;
    }

    bool remove(int val) {
        auto it = index.find(val);
        if (it == index.end()) return false;
        // Order does not matter, so the last value fills the hole and the array stays dense.
        size_t i = it->second;
        index.erase(it);
        int last = values.back();
        values.pop_back();
        if (i < values.size()) {
            values[i] = last;
            index[last] = i;
        }
        return true;
    }

    int getRandom() {
        return values[uniform_int_distribution<size_t>(0, values.size() - 1)(rng)];
    }

private:
    vector<int> values;
    unordered_map<int, size_t> index;
    mt19937 rng;
};
