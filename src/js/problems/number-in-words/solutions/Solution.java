class Solution {
    private static final String[] BELOW_20 = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    };
    private static final String[] TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };
    private static final String[] SCALES = {"", "Thousand", "Million", "Billion"};

    // O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
    public String numberToWords(int num) {
        if (num == 0) return "Zero";
        String[] groups = new String[4];
        int count = 0;
        int scale = 0;
        while (num > 0) {
            int chunk = num % 1000;
            if (chunk > 0) {
                StringBuilder part = new StringBuilder();
                appendChunk(part, chunk);
                if (!SCALES[scale].isEmpty()) {
                    part.append(' ').append(SCALES[scale]);
                }
                groups[count++] = part.toString();
            }
            num /= 1000;
            scale++;
        }
        StringBuilder out = new StringBuilder();
        for (int i = count - 1; i >= 0; i--) {
            if (out.length() > 0) out.append(' ');
            out.append(groups[i]);
        }
        return out.toString();
    }

    private void appendChunk(StringBuilder sb, int n) {
        if (n >= 100) {
            sb.append(BELOW_20[n / 100]).append(" Hundred");
            n %= 100;
            if (n > 0) sb.append(' ');
        }
        if (n >= 20) {
            sb.append(TENS[n / 10]);
            n %= 10;
            if (n > 0) sb.append(' ');
        }
        if (n > 0) {
            sb.append(BELOW_20[n]);
        }
    }
}
