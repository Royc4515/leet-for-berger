// O(n) time, O(1) space: a fast pointer gains one node per step on a slow one, so inside a loop
// it must land on the slow pointer; without a loop it falls off the end first.
bool hasCycle(struct ListNode* head) {
    struct ListNode* slow = head;
    struct ListNode* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
