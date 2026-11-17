// O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
function dailyTemperatures(temperatures: number[]): number[] {
  const answer: number[] = new Array(temperatures.length).fill(0);
  const waiting: number[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    // Today answers every waiting day that is strictly cooler; equal days keep waiting.
    while (waiting.length > 0 && temperatures[waiting[waiting.length - 1]] < temperatures[i]) {
      const d = waiting.pop()!;
      answer[d] = i - d;
    }
    waiting.push(i);
  }
  // Days left on the stack never see a warmer day, and their answer is already 0.
  return answer;
}
