class Solution {
public:
    // O(n) time, O(1) space - iterative rewiring.
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        while (head) {
            // Save the rest of the list before the pointer that leads to it is overwritten.
            ListNode* next = head->next;
            head->next = prev;
            prev = head;
            head = next;
        }
        return prev;
    }
};
