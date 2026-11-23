// O(n) time, O(1) extra space: advance slow by 1 and fast by 2 to land on floor(n / 2).
struct ListNode* middleNode(struct ListNode* head) {
    struct ListNode* slow = head;
    struct ListNode* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}
