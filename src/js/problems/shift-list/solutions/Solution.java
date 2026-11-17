// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0061.Rotate%20List/Solution.java
class Solution {
    // O(n) time, O(1) space: count, reduce k, then cut once with two pointers.
    public ListNode rotateRight(ListNode head, int k) {
        // Checking for an empty list first also avoids k % 0 below.
        if (head == null || head.next == null) {
            return head;
        }
        ListNode cur = head;
        int n = 0;
        for (; cur != null; cur = cur.next) {
            n++;
        }
        // Every n rotations is a full turn, so only k mod n steps matter.
        k %= n;
        if (k == 0) {
            return head;
        }
        // fast runs k nodes ahead; when it reaches the tail, slow is the node before the new head.
        ListNode fast = head;
        ListNode slow = head;
        while (k-- > 0) {
            fast = fast.next;
        }
        while (fast.next != null) {
            fast = fast.next;
            slow = slow.next;
        }
        ListNode ans = slow.next;
        slow.next = null;
        fast.next = head;
        return ans;
    }
}
