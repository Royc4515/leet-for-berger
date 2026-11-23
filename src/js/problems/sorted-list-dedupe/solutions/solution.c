// O(n) time, O(1) extra space: skip adjacent equal nodes without advancing until the value changes.
struct ListNode* dedupeSortedList(struct ListNode* head) {
    struct ListNode* curr = head;
    while (curr && curr->next) {
        if (curr->val == curr->next->val) {
            curr->next = curr->next->next;
        } else {
            curr = curr->next;
        }
    }
    return head;
}
