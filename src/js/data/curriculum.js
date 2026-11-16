/**
 * Learning Path: 4 milestones. Problems link to milestones via `milestone` in the catalog,
 * so progress here is always derived from real solve data, never stored twice.
 */
export const MILESTONES = [
  {
    id: 1,
    title: 'Foundations',
    summary: 'The vocabulary every other pattern is written in.',
    topics: ['Arrays', 'Hash Maps', 'Basic String Manipulation', 'Two Pointers'],
    outcomes: ['Pick the right container in under a minute', 'Reason about O(n) vs O(n log n) vs O(n^2) on sight'],
  },
  {
    id: 2,
    title: 'Algorithmic Patterns',
    summary: 'Recognize the shape of a problem before writing code.',
    topics: ['Sliding Window', 'Greedy Optimization', 'Binary Search', 'Sorting'],
    outcomes: ['Prove a greedy choice instead of hoping', 'Binary search on the answer, not only on arrays'],
  },
  {
    id: 3,
    title: 'Advanced Data Structures',
    summary: 'Structures that turn exponential ideas into tractable ones.',
    topics: ['Trees', 'Graphs', 'Heaps', 'Backtracking'],
    outcomes: ['BFS vs DFS by problem constraint', 'Prune a backtracking tree deliberately'],
  },
  {
    id: 4,
    title: 'Dynamic Programming & OA Prep',
    summary: 'State design, transitions, and timed online-assessment practice.',
    topics: ['1D DP', '2D DP', 'Graph Traversal Optimization', 'OA Preparation'],
    outcomes: ['Define DP state in one sentence', 'Finish a 2-problem OA inside 45 minutes'],
  },
];
