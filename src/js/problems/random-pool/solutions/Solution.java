import java.util.*;

// O(1) average per operation: the values sit in a dense array for uniform picks, and a map from
// value to array index makes membership and removal constant time.
class RandomizedSet {
    private final List<Integer> values = new ArrayList<>();
    private final Map<Integer, Integer> index = new HashMap<>();
    private final Random random = new Random();

    public RandomizedSet() {
    }

    public boolean insert(int val) {
        if (index.containsKey(val)) return false;
        index.put(val, values.size());
        values.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer i = index.remove(val);
        if (i == null) return false;
        // Order does not matter, so the last value fills the hole and the array stays dense.
        int last = values.remove(values.size() - 1);
        if (i < values.size()) {
            values.set(i, last);
            index.put(last, i);
        }
        return true;
    }

    public int getRandom() {
        return values.get(random.nextInt(values.size()));
    }
}
