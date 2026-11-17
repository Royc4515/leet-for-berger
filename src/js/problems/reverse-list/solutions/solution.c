// O(n) time, O(1) space - iterative rewiring.
struct ListNode* reverseList(struct ListNode* head) {
    struct ListNode* prev = NULL;
    while (head) {
        // Save the rest of the list before the pointer that leads to it is overwritten.
        struct ListNode* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
