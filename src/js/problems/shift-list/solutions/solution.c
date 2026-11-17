// O(n) time, O(1) space: one walk finds the length and the tail, then one cut.
struct ListNode* rotateRight(struct ListNode* head, int k) {
    // Checking for an empty list first also avoids k % 0 below.
    if (head == NULL || head->next == NULL) return head;
    int n = 1;
    struct ListNode* tail = head;
    while (tail->next) {
        tail = tail->next;
        n++;
    }
    // Every n rotations is a full turn, so only k mod n steps matter.
    k %= n;
    if (k == 0) return head;
    // The new tail is the (n - k)th node; everything after it moves to the front.
    struct ListNode* newTail = head;
    for (int i = 1; i < n - k; i++) newTail = newTail->next;
    struct ListNode* newHead = newTail->next;
    newTail->next = NULL;
    tail->next = head;
    return newHead;
}
