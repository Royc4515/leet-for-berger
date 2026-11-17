class Solution {
    // O(n) time - ASCII fits in arrays; one table per direction catches each kind of collision.
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] fwd = new int[128];
        int[] back = new int[128];
        for (int i = 0; i < s.length(); i++) {
            // Store char + 1 so that 0 can mean "not mapped yet".
            int a = s.charAt(i), b = t.charAt(i);
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
