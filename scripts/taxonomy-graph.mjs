// Prints the learning network as a Mermaid graph plus a ladder table, for content/README.md.
// Usage: node scripts/taxonomy-graph.mjs
import { TOPICS, ladderTotals } from '../src/js/data/taxonomy.js';

const lines = ['```mermaid', 'graph TD'];
for (const t of TOPICS) lines.push(`  ${t.id.replace(/-/g, '_')}["${t.title}"]`);
for (const t of TOPICS) {
  for (const p of t.prereqs) lines.push(`  ${p.replace(/-/g, '_')} --> ${t.id.replace(/-/g, '_')}`);
}
lines.push('```', '', '| Tier | Topic | Easy | Medium | Hard | Concepts (in ladder order) |', '|---|---|---|---|---|---|');
for (const t of TOPICS) {
  const { easy, medium, hard } = t.ladder;
  lines.push(`| ${t.tier} | ${t.title} | ${easy} | ${medium} | ${hard} | ${t.concepts.join(', ')} |`);
}
const tot = ladderTotals(TOPICS);
lines.push(`| | **Total (${tot.all})** | **${tot.easy}** | **${tot.medium}** | **${tot.hard}** | |`);
console.log(lines.join('\n'));
