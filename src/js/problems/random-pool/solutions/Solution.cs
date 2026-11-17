// O(1) average per operation: the values sit in a dense array for uniform picks, and a map from
// value to array index makes membership and removal constant time.
public class RandomizedSet {
    private readonly List<int> values = new List<int>();
    private readonly Dictionary<int, int> index = new Dictionary<int, int>();
    private readonly Random random = new Random();

    public RandomizedSet() {
    }

    public bool Insert(int val) {
        if (index.ContainsKey(val)) return false;
        index[val] = values.Count;
        values.Add(val);
        return true;
    }

    public bool Remove(int val) {
        if (!index.Remove(val, out int i)) return false;
        // Order does not matter, so the last value fills the hole and the array stays dense.
        int last = values[values.Count - 1];
        values.RemoveAt(values.Count - 1);
        if (i < values.Count) {
            values[i] = last;
            index[last] = i;
        }
        return true;
    }

    public int GetRandom() {
        return values[random.Next(values.Count)];
    }
}
