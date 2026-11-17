// O(total length) per call. Length framing: the decoder reads a number, then copies exactly that
// many characters, so no character inside a string ever needs escaping.
class Codec {
public:
    Codec() {
    }

    string encode(vector<string>& strs) {
        string out;
        for (const string& s : strs) {
            out += to_string(s.size());
            out += '#';
            out += s;
        }
        return out;
    }

    vector<string> decode(string s) {
        vector<string> out;
        size_t i = 0;
        while (i < s.size()) {
            // The first '#' after i ends the length; the string itself may contain more of them.
            size_t j = s.find('#', i);
            size_t size = stoul(s.substr(i, j - i));
            out.push_back(s.substr(j + 1, size));
            // Move an index instead of erasing the decoded prefix.
            i = j + 1 + size;
        }
        return out;
    }
};
