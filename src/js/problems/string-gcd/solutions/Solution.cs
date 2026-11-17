public class Solution {
    // O(m + n) time - concatenation test, then the gcd-length prefix.
    public string GcdOfStrings(string str1, string str2) {
        // If both strings repeat the same x, gluing them in either order gives the same string;
        // if they do not, some position disagrees.
        if (str1 + str2 != str2 + str1) return "";
        // Any common divisor's length divides both lengths, and the gcd-length prefix is one of them.
        return str1.Substring(0, Gcd(str1.Length, str2.Length));
    }

    private static int Gcd(int a, int b) {
        while (b != 0) {
            (a, b) = (b, a % b);
        }
        return a;
    }
}
