// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0017.Letter%20Combinations%20of%20a%20Phone%20Number/Solution.java
import java.util.*;

class Solution {
    // O(4^n * n) time - extend every partial string by each letter of the next digit.
    public List<String> letterCombinations(String digits) {
        List<String> ans = new ArrayList<>();
        // Without this check the loop would return [""] for no digits.
        if (digits.length() == 0) {
            return ans;
        }
        ans.add("");
        String[] d = new String[] {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        for (char i : digits.toCharArray()) {
            String s = d[i - '2'];
            List<String> t = new ArrayList<>(ans.size() * s.length());
            // Prefixes outer, letters inner: the result stays in lexicographic order.
            for (String a : ans) {
                for (char b : s.toCharArray()) {
                    t.add(a + b);
                }
            }
            ans = t;
        }
        return ans;
    }
}
