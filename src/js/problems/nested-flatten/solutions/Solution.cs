// O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
// item is visited once over the whole run.
public class NestedIterator {
    // Parallel stacks: a list and the index of its next unread item.
    private readonly List<IList<NestedInteger>> lists = new List<IList<NestedInteger>>();
    private readonly List<int> pos = new List<int>();

    public NestedIterator(IList<NestedInteger> nestedList) {
        lists.Add(nestedList);
        pos.Add(0);
    }

    public int Next() {
        HasNext();
        int top = lists.Count - 1;
        return lists[top][pos[top]++].GetInteger();
    }

    // Settles on the next integer without consuming it, so calling this twice changes nothing.
    public bool HasNext() {
        while (lists.Count > 0) {
            int top = lists.Count - 1;
            var items = lists[top];
            if (pos[top] == items.Count) {
                lists.RemoveAt(top);
                pos.RemoveAt(top);
                continue;
            }
            var item = items[pos[top]];
            if (item.IsInteger()) return true;
            pos[top]++;
            lists.Add(item.GetList());
            pos.Add(0);
        }
        return false;
    }
}
