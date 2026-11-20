// set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
// checkpoint they were made under. Ids only grow, so each slot's list stays sorted.
class CheckpointArray {
  /**
   * @param {number} length
   */
  constructor(length) {
    this.ids = new Map();
    this.vals = new Map();
    this.taken = 0;
  }

  /**
   * @param {number} index
   * @param {number} val
   * @return {void}
   */
  set(index, val) {
    let ids = this.ids.get(index);
    if (!ids) {
      ids = [];
      this.ids.set(index, ids);
      this.vals.set(index, []);
    }
    const vals = this.vals.get(index);
    // A second write inside the same checkpoint replaces the first one.
    if (ids.length && ids[ids.length - 1] === this.taken) {
      vals[vals.length - 1] = val;
    } else {
      ids.push(this.taken);
      vals.push(val);
    }
  }

  /**
   * @return {number}
   */
  snap() {
    return this.taken++;
  }

  /**
   * @param {number} index
   * @param {number} snapId
   * @return {number}
   */
  get(index, snapId) {
    const ids = this.ids.get(index);
    if (!ids) return 0;
    // Find the first write made under an id > snapId; the one before it is the answer.
    let lo = 0;
    let hi = ids.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ids[mid] <= snapId) lo = mid + 1;
      else hi = mid;
    }
    return lo === 0 ? 0 : this.vals.get(index)[lo - 1];
  }
}
