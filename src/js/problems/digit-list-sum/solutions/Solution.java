// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0002.Add%20Two%20Numbers/Solution.java
class Solution {
    // O(max(m, n)) - grade-school addition, one digit per node.
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // A placeholder head avoids special-casing the first output node.
        ListNode dummy = new ListNode(0);
        int carry = 0;
        ListNode cur = dummy;
        // Keep going while a carry is left: 999 + 1 needs one node more than either input.
        while (l1 != null || l2 != null || carry != 0) {
            int s = (l1 == null ? 0 : l1.val) + (l2 == null ? 0 : l2.val) + carry;
            carry = s / 10;
            cur.next = new ListNode(s % 10);
            cur = cur.next;
            l1 = l1 == null ? null : l1.next;
            l2 = l2 == null ? null : l2.next;
        }
        return dummy.next;
    }
}
