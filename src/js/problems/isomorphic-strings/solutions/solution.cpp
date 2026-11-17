class Solution {
public:
    // O(n) time - ASCII fits in arrays; one table per direction catches each kind of collision.
    bool isIsomorphic(string s, string t) {
        if (s.size() != t.size()) return false;
        int fwd[128] = {0}, back[128] = {0};
        for (size_t i = 0; i < s.size(); i++) {
            // Store char + 1 so that 0 can mean "not mapped yet".
            int a = (unsigned char)s[i], b = (unsigned char)t[i];
            if (!fwd[a] && !back[b]) {
                fwd[a] = b + 1;
                back[b] = a + 1;
            } else if (fwd[a] != b + 1 || back[b] != a + 1) {
                return false;
            }
        }
        return true;
    }
};
