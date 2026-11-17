// O(n log n) time - only the order of start and end events matters, not which meeting owns them.
function minMeetingRooms(intervals: number[][]): number {
  // Typed arrays sort numerically by default; plain arrays would sort as strings.
  const starts = Float64Array.from(intervals, (r) => r[0]).sort();
  const ends = Float64Array.from(intervals, (r) => r[1]).sort();
  let rooms = 0;
  let e = 0;
  for (const s of starts) {
    // ends[e] is the earliest time a busy room frees up. `<` because a meeting ending at s
    // has already left its room, so the new meeting can take it.
    if (s < ends[e]) rooms++;
    else e++;
  }
  return rooms;
}
