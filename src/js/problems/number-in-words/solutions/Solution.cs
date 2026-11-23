public class Solution {
    private static readonly string[] Below20 = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    };
    private static readonly string[] Tens = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };
    private static readonly string[] Scales = { "", "Thousand", "Million", "Billion" };

    // O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
    public string NumberToWords(int num) {
        if (num == 0) return "Zero";
        int[] chunks = new int[4];
        int count = 0;
        while (num > 0) {
            chunks[count++] = num % 1000;
            num /= 1000;
        }
        var sb = new System.Text.StringBuilder();
        for (int i = count - 1; i >= 0; i--) {
            if (chunks[i] == 0) continue;
            AppendChunk(sb, chunks[i]);
            if (Scales[i].Length > 0) AppendWord(sb, Scales[i]);
        }
        return sb.ToString();
    }

    private static void AppendWord(System.Text.StringBuilder sb, string word) {
        if (sb.Length > 0) sb.Append(' ');
        sb.Append(word);
    }

    private static void AppendChunk(System.Text.StringBuilder sb, int n) {
        if (n >= 100) {
            AppendWord(sb, Below20[n / 100]);
            AppendWord(sb, "Hundred");
            n %= 100;
        }
        if (n >= 20) {
            AppendWord(sb, Tens[n / 10]);
            n %= 10;
        }
        if (n > 0) AppendWord(sb, Below20[n]);
    }
}
