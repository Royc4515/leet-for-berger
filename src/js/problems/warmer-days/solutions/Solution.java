class Solution {
    // O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n]; // Java zero-fills, which is the answer for days never answered
        int[] waiting = new int[n];
        int top = 0;
        for (int i = 0; i < n; i++) {
            // Today answers every waiting day that is strictly cooler; equal days keep waiting.
            while (top > 0 && temperatures[waiting[top - 1]] < temperatures[i]) {
                int d = waiting[--top];
                answer[d] = i - d;
            }
            waiting[top++] = i;
        }
        return answer;
    }
}
