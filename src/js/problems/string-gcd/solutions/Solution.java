class Solution {
    // O(m + n) time - concatenation test, then the gcd-length prefix.
    public String gcdOfStrings(String str1, String str2) {
        // If both strings repeat the same x, gluing them in either order gives the same string;
        // if they do not, some position disagrees.
        if (!(str1 + str2).equals(str2 + str1)) return "";
        // Any common divisor's length divides both lengths, and the gcd-length prefix is one of them.
        return str1.substring(0, gcd(str1.length(), str2.length()));
    }

    private static int gcd(int a, int b) {
        while (b != 0) {
            int t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
}
