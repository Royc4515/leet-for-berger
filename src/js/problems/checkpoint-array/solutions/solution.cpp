// set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
// checkpoint they were made under. Ids only grow, so each slot's list stays sorted.
class CheckpointArray {
private:
    unordered_map<int, vector<pair<int, int>>> history; // slot -> (checkpoint id, value)
    int taken = 0;

public:
    CheckpointArray(int length) {}

    void set(int index, int val) {
        auto& h = history[index];
        // A second write inside the same checkpoint replaces the first one.
        if (!h.empty() && h.back().first == taken) {
            h.back().second = val;
        } else {
            h.emplace_back(taken, val);
        }
    }

    int snap() {
        return taken++;
    }

    int get(int index, int snapId) {
        auto it = history.find(index);
        if (it == history.end()) return 0;
        auto& h = it->second;
        // First write made under an id > snapId; the one before it is the answer.
        auto pos = upper_bound(h.begin(), h.end(), snapId, [](int id, const pair<int, int>& e) { return id < e.first; });
        return pos == h.begin() ? 0 : prev(pos)->second;
    }
};
