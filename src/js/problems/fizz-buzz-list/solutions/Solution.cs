public class Solution {
    // O(n) time - two independent checks build the label, so a multiple of both gets both words.
    public string[] FizzBuzzList(int n) {
        string[] result = new string[n];
        for (int i = 1; i <= n; i++) {
            string label = "";
            if (i % 3 == 0) label += "Fizz";
            if (i % 5 == 0) label += "Buzz";
            result[i - 1] = label.Length > 0 ? label : i.ToString();
        }
        return result;
    }
}
