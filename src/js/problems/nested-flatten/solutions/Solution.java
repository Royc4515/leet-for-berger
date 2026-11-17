import java.util.*;

// O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
// item is visited once over the whole run.
class NestedIterator {
    // Parallel stacks: a list and the index of its next unread item.
    private final List<List<NestedInteger>> lists = new ArrayList<>();
    private final List<Integer> pos = new ArrayList<>();

    public NestedIterator(List<NestedInteger> nestedList) {
        lists.add(nestedList);
        pos.add(0);
    }

    public int next() {
        hasNext();
        int top = lists.size() - 1;
        int i = pos.get(top);
        pos.set(top, i + 1);
        return lists.get(top).get(i).getInteger();
    }

    // Settles on the next integer without consuming it, so calling this twice changes nothing.
    public boolean hasNext() {
        while (!lists.isEmpty()) {
            int top = lists.size() - 1;
            List<NestedInteger> items = lists.get(top);
            int i = pos.get(top);
            if (i == items.size()) {
                lists.remove(top);
                pos.remove(top);
                continue;
            }
            if (items.get(i).isInteger()) return true;
            pos.set(top, i + 1);
            lists.add(items.get(i).getList());
            pos.add(0);
        }
        return false;
    }
}
