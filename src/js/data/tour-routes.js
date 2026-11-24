/**
 * Which tour each page shows on its first visit (the content is data/tours.js). Its own small
 * module so main.js can pick a page's tour at startup without loading every tour's copy.
 */

/** Route patterns and the tour each page shows on its first visit, first match wins. */
const ROUTE_TOURS = [
  [/^#?\/?$/, 'problems'],
  [/^#\/problem\/[\w-]+$/, 'workspace'],
  [/^#\/map(\/|$)/, 'map'],
  [/^#\/daily$/, 'daily'],
  [/^#\/path$/, 'path'],
  [/^#\/companies$/, 'companies'],
  [/^#\/companies\/[\w-]+$/, 'company'],
  [/^#\/modes$/, 'modes'],
  [/^#\/interview$/, 'interview'],
  [/^#\/battle$/, 'battle'],
  [/^#\/quiz$/, 'quiz'],
];

/**
 * The tour a route shows on its first visit (and replays from "Guide for this page").
 * @param {string} hash location.hash, '' for the home page
 * @returns {string|null} a TOURS id
 */
export function tourForRoute(hash) {
  const route = hash || '#/';
  return ROUTE_TOURS.find(([re]) => re.test(route))?.[1] ?? null;
}
