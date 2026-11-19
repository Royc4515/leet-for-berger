class Solution {
public:
    // O(n) time, O(1) space: find the middle, reverse the second half in place, compare the halves.
    bool isMirror(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }

        // slow is the first node of the second half (the middle node itself for an odd length).
        ListNode* prev = nullptr;
        while (slow) {
            // Save the rest of the list before the pointer that leads to it is overwritten.
            ListNode* next = slow->next;
            slow->next = prev;
            prev = slow;
            slow = next;
        }

        // The reversed half is the shorter or equal one, so it decides when to stop: for an odd
        // length the middle node is simply never paired with anything.
        ListNode* left = head;
        ListNode* right = prev;
        while (right) {
            if (left->val != right->val) {
                return false;
            }
            left = left->next;
            right = right->next;
        }
        return true;
    }
};
