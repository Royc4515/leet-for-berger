// O(1) per call: one counter holds the length of the current run of target readings.
class StreakWatch {
  private target: number;
  private k: number;
  private run = 0;

  constructor(target: number, k: number) {
    this.target = target;
    this.k = k;
  }

  observe(reading: number): boolean {
    // Any other value breaks the run; the last k readings are all the target exactly when the
    // run is at least k long (a longer run keeps answering true).
    this.run = reading === this.target ? this.run + 1 : 0;
    return this.run >= this.k;
  }
}
