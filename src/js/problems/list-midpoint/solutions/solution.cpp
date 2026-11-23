class Solution {
public:
    // O(n) time, O(1) extra space: advance slow by 1 and fast by 2 to land on floor(n / 2).
    ListNode* middleNode(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};
