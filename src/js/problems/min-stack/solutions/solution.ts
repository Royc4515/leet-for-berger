// O(1) per operation: every entry remembers the minimum of the stack up to and including it.
class MinStack {
  private vals: number[] = [];
  private mins: number[] = [];

  push(val: number): void {
    // The minimum below an entry never changes while that entry sits on the stack.
    const below = this.mins.length ? this.mins[this.mins.length - 1] : val;
    this.vals.push(val);
    this.mins.push(Math.min(val, below));
  }

  pop(): void {
    this.vals.pop();
    this.mins.pop();
  }

  top(): number {
    return this.vals[this.vals.length - 1];
  }

  getMin(): number {
    return this.mins[this.mins.length - 1];
  }
}
