class Solution {
    // O(n) time - two independent checks build the label, so a multiple of both gets both words.
    public String[] fizzBuzzList(int n) {
        String[] out = new String[n];
        for (int i = 1; i <= n; i++) {
            StringBuilder label = new StringBuilder();
            if (i % 3 == 0) label.append("Fizz");
            if (i % 5 == 0) label.append("Buzz");
            out[i - 1] = label.length() > 0 ? label.toString() : String.valueOf(i);
        }
        return out;
    }
}
