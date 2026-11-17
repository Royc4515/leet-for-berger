// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0023.Merge%20k%20Sorted%20Lists/Solution.cpp
class Solution {
public:
    // O(N log k): a min-heap holds the current head of every non-empty list.
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        // priority_queue is a max-heap, so "greater value" means lower priority.
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
        for (auto head : lists) {
            if (head) {
                pq.push(head);
            }
        }
        // A placeholder head on the stack avoids special-casing the first node, and does not leak.
        ListNode dummy;
        ListNode* cur = &dummy;
        while (!pq.empty()) {
            ListNode* node = pq.top();
            pq.pop();
            if (node->next) {
                pq.push(node->next);
            }
            cur->next = node;
            cur = cur->next;
        }
        return dummy.next;
    }
};
