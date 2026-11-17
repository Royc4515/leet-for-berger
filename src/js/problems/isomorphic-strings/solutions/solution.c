// O(n) time - ASCII fits in arrays; one table per direction catches each kind of collision.
bool isIsomorphic(char* s, char* t) {
    int fwd[128] = {0}, back[128] = {0};
    int i = 0;
    for (; s[i] && t[i]; i++) {
        // Store char + 1 so that 0 can mean "not mapped yet".
        int a = (unsigned char)s[i], b = (unsigned char)t[i];
        if (!fwd[a] && !back[b]) {
            fwd[a] = b + 1;
            back[b] = a + 1;
        } else if (fwd[a] != b + 1 || back[b] != a + 1) {
            return false;
        }
    }
    return s[i] == t[i]; // both ended: same length
}
