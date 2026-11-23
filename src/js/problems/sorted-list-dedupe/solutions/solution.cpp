class Solution {
public:
    // O(n) time, O(1) extra space: skip adjacent equal nodes without advancing until the value changes.
    ListNode* dedupeSortedList(ListNode* head) {
        ListNode* curr = head;
        while (curr && curr->next) {
            if (curr->val == curr->next->val) {
                curr->next = curr->next->next;
            } else {
                curr = curr->next;
            }
        }
        return head;
    }
};
