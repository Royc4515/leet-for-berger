// O(1) per call: one counter holds the length of the current run of target readings.
class StreakWatch {
  /**
   * @param {number} target
   * @param {number} k
   */
  constructor(target, k) {
    this.target = target;
    this.k = k;
    this.run = 0;
  }

  /**
   * @param {number} reading
   * @return {boolean}
   */
  observe(reading) {
    // Any other value breaks the run; the last k readings are all the target exactly when the
    // run is at least k long (a longer run keeps answering true).
    this.run = reading === this.target ? this.run + 1 : 0;
    return this.run >= this.k;
  }
}
