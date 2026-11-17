public class Solution {
    // O(n) time - ASCII fits in arrays; one table per direction catches each kind of collision.
    public bool IsIsomorphic(string s, string t) {
        if (s.Length != t.Length) return false;
        var fwd = new int[128];
        var back = new int[128];
        for (int i = 0; i < s.Length; i++) {
            // Store char + 1 so that 0 can mean "not mapped yet".
            int a = s[i], b = t[i];
            if (fwd[a] == 0 && back[b] == 0) {
                fwd[a] = b + 1;
                back[b] = a + 1;
            } else if (fwd[a] != b + 1 || back[b] != a + 1) {
                return false;
            }
        }
        return true;
    }
}
