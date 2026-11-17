import java.util.*;

class Solution {
    // O(n) time and space. Pass 1 makes a copy of every node; pass 2 wires both pointers through
    // the map, keyed by the original node itself (values can repeat).
    public RandomListNode copyRandomList(RandomListNode head) {
        Map<RandomListNode, RandomListNode> copyOf = new HashMap<>();
        for (RandomListNode node = head; node != null; node = node.next) copyOf.put(node, new RandomListNode(node.val));
        for (RandomListNode node = head; node != null; node = node.next) {
            RandomListNode copy = copyOf.get(node);
            copy.next = copyOf.get(node.next);
            copy.random = copyOf.get(node.random);
        }
        return copyOf.get(head);
    }
}
