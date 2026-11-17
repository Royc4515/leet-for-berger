class Solution {
public:
    // O(log10 x) time - reverse only the lower half of the digits. Reversing all of them would
    // overflow int for inputs like 1234567899; half of a 10-digit number always fits.
    bool isPalindrome(int x) {
        // A trailing zero would need a leading zero to match; only 0 itself qualifies.
        if (x < 0 || (x % 10 == 0 && x != 0)) return false;
        int half = 0;
        while (x > half) {
            half = half * 10 + x % 10;
            x /= 10;
        }
        // Odd digit count: the middle digit ended up in half, so drop it before comparing.
        return x == half || x == half / 10;
    }
};
