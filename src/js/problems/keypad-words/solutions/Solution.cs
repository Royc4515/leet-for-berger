// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0017.Letter%20Combinations%20of%20a%20Phone%20Number/Solution.cs
public class Solution {
    // O(4^n * n) time - extend every partial string by each letter of the next digit.
    public string[] LetterCombinations(string digits) {
        var ans = new List<string>();
        // Without this check the loop would return [""] for no digits.
        if (digits.Length == 0) {
            return ans.ToArray();
        }
        ans.Add("");
        string[] d = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        foreach (char i in digits) {
            string s = d[i - '2'];
            var t = new List<string>(ans.Count * s.Length);
            // Prefixes outer, letters inner: the result stays in lexicographic order.
            foreach (string a in ans) {
                foreach (char b in s) {
                    t.Add(a + b);
                }
            }
            ans = t;
        }
        return ans.ToArray();
    }
}
