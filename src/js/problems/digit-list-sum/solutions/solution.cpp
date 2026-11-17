// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0002.Add%20Two%20Numbers/Solution.cpp
class Solution {
public:
    // O(max(m, n)) - grade-school addition, one digit per node.
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        // A placeholder head avoids special-casing the first output node.
        ListNode dummy;
        int carry = 0;
        ListNode* cur = &dummy;
        // Keep going while a carry is left: 999 + 1 needs one node more than either input.
        while (l1 || l2 || carry) {
            int s = (l1 ? l1->val : 0) + (l2 ? l2->val : 0) + carry;
            carry = s / 10;
            cur->next = new ListNode(s % 10);
            cur = cur->next;
            l1 = l1 ? l1->next : nullptr;
            l2 = l2 ? l2->next : nullptr;
        }
        return dummy.next;
    }
};
