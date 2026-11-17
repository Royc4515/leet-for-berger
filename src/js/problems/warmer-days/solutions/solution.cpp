class Solution {
public:
    // O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = (int)temperatures.size();
        vector<int> answer(n, 0); // 0 is already right for days that are never answered
        vector<int> waiting;
        for (int i = 0; i < n; i++) {
            // Today answers every waiting day that is strictly cooler; equal days keep waiting.
            while (!waiting.empty() && temperatures[waiting.back()] < temperatures[i]) {
                answer[waiting.back()] = i - waiting.back();
                waiting.pop_back();
            }
            waiting.push_back(i);
        }
        return answer;
    }
};
