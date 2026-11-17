public class Solution {
    // O(n) time and space. Pass 1 makes a copy of every node; pass 2 wires both pointers through
    // the map, keyed by the original node itself (values can repeat).
    public RandomListNode CopyRandomList(RandomListNode head) {
        var copyOf = new Dictionary<RandomListNode, RandomListNode>();
        for (var node = head; node != null; node = node.next) copyOf[node] = new RandomListNode(node.val);
        for (var node = head; node != null; node = node.next) {
            var copy = copyOf[node];
            copy.next = node.next == null ? null : copyOf[node.next];
            copy.random = node.random == null ? null : copyOf[node.random];
        }
        return head == null ? null : copyOf[head];
    }
}
