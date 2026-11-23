class Solution {
public:
    // O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
    string numberToWords(int num) {
        if (num == 0) return "Zero";
        static const char* BELOW_20[] = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
        };
        static const char* TENS[] = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        };
        static const char* SCALES[] = {"", "Thousand", "Million", "Billion"};

        auto spellChunk = [&](int n) {
            string s;
            if (n >= 100) {
                s += BELOW_20[n / 100];
                s += " Hundred";
                n %= 100;
                if (n > 0) s += ' ';
            }
            if (n >= 20) {
                s += TENS[n / 10];
                n %= 10;
                if (n > 0) s += ' ';
            }
            if (n > 0) s += BELOW_20[n];
            return s;
        };

        vector<string> groups;
        int scale = 0;
        while (num > 0) {
            int chunk = num % 1000;
            if (chunk > 0) {
                string part = spellChunk(chunk);
                if (SCALES[scale][0] != '\0') {
                    part += ' ';
                    part += SCALES[scale];
                }
                groups.push_back(move(part));
            }
            num /= 1000;
            scale++;
        }
        string out;
        for (int i = (int)groups.size() - 1; i >= 0; i--) {
            if (!out.empty()) out += ' ';
            out += groups[i];
        }
        return out;
    }
};
