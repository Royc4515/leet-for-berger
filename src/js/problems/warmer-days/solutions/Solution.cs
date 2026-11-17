public class Solution {
    // O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
    public int[] DailyTemperatures(int[] temperatures) {
        var answer = new int[temperatures.Length]; // zero-filled: right for days never answered
        var waiting = new Stack<int>();
        for (int i = 0; i < temperatures.Length; i++) {
            // Today answers every waiting day that is strictly cooler; equal days keep waiting.
            while (waiting.Count > 0 && temperatures[waiting.Peek()] < temperatures[i]) {
                int d = waiting.Pop();
                answer[d] = i - d;
            }
            waiting.Push(i);
        }
        return answer;
    }
}
