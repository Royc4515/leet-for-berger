/**
 * Practice by company: for each company, the problems it asks, most frequent first, with one
 * row per family (the version that company asks most) and a link to practice it on the site.
 *
 * Built at content time (scripts/content/build-meta.mjs) into src/js/data/company-sets.json, in a
 * compact shape: a shared problem table plus per-company rows that point into it.
 *
 * Pure: no DOM, no I/O.
 */

import { companySizes } from './problem-meta.js';

/** Companies need at least this many tagged problems to get a page (Israeli companies always do). */
export const MIN_PROBLEMS = 10;
/** Rows kept per company; past this the frequencies are too low to guide practice. */
export const PER_COMPANY = 60;

const RECENCY = ['30d', '3m', '6m', 'older'];

/**
 * URL-safe id for a company name ("monday.com" -> "monday-com").
 * @param {string} name
 * @returns {string}
 */
export function companySlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * @typedef {{ slug: string, number: number|null, title: string, difficulty: string, contentId: string|null }} SetProblem
 * @typedef {[problem: number, frequency: number, recency: number, practice: number|null, versions: number]} SetRow
 *   problem: index into `problems` (the version this company asks); practice: index of the version
 *   to open on the site (itself, or a family sibling when it is not on the site yet), null when no
 *   version is; versions: how many versions of this family the company asks (1 outside families)
 * @typedef {{ name: string, slug: string, israeli: boolean, total: number, rows: SetRow[] }} CompanySet
 * @typedef {{ problems: SetProblem[], companies: CompanySet[] }} CompanySets
 */

/**
 * @param {object[]} records index records
 * @param {{ id: string, members: { slug: string }[] }[]} families
 * @param {string[]} israeliNames
 * @returns {CompanySets}
 */
export function buildCompanySets(records, families, israeliNames) {
  const israeli = new Set(israeliNames);
  const sizes = companySizes(records);
  const bySlug = new Map(records.map((r) => [r.slug, r]));
  const familyOf = new Map();
  for (const f of families) for (const m of f.members) familyOf.set(m.slug, f);

  const problems = [];
  const problemIndex = new Map();
  const ref = (slug) => {
    if (!problemIndex.has(slug)) {
      const r = bySlug.get(slug);
      problemIndex.set(slug, problems.length);
      problems.push({ slug, number: r.platform === 'leetcode' ? r.number ?? null : null, title: r.title, difficulty: r.difficulty, contentId: r.contentId ?? null });
    }
    return problemIndex.get(slug);
  };

  /** What to open for a row: the version itself when shipped, else the family's first shipped member. */
  const practiceFor = (slug) => {
    if (bySlug.get(slug)?.contentId) return slug;
    const f = familyOf.get(slug);
    return f?.members.find((m) => bySlug.get(m.slug)?.contentId)?.slug ?? null;
  };

  const byCompany = new Map();
  for (const r of records) {
    for (const c of r.companies ?? []) {
      if (!byCompany.has(c.name)) byCompany.set(c.name, []);
      byCompany.get(c.name).push({ slug: r.slug, frequency: c.frequency, recency: c.recency });
    }
  }

  const companies = [];
  for (const [name, asked] of byCompany) {
    if ((sizes.get(name) ?? 0) < MIN_PROBLEMS && !israeli.has(name)) continue;
    asked.sort((a, b) => b.frequency - a.frequency || RECENCY.indexOf(a.recency) - RECENCY.indexOf(b.recency) || a.slug.localeCompare(b.slug));
    // One row per family: the first (most asked) version wins, later versions only bump its count.
    const rows = [];
    const familyRow = new Map();
    for (const a of asked) {
      const f = familyOf.get(a.slug);
      if (f && familyRow.has(f.id)) {
        familyRow.get(f.id)[4] += 1;
        continue;
      }
      if (rows.length >= PER_COMPANY) continue;
      const practice = practiceFor(a.slug);
      const row = [ref(a.slug), Math.round(a.frequency), Math.max(0, RECENCY.indexOf(a.recency)), practice ? ref(practice) : null, 1];
      if (f) familyRow.set(f.id, row);
      rows.push(row);
    }
    companies.push({ name, slug: companySlug(name), israeli: israeli.has(name), total: asked.length, rows });
  }
  companies.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return { problems, companies };
}

/**
 * Rows of one company in display form.
 * @param {CompanySets} sets
 * @param {CompanySet} company
 * @returns {{ problem: SetProblem, frequency: number, recency: string, practice: SetProblem|null, similar: boolean, versions: number }[]}
 */
export function expandRows(sets, company) {
  return company.rows.map(([p, frequency, recency, practice, versions]) => ({
    problem: sets.problems[p],
    frequency,
    recency: RECENCY[recency],
    practice: practice === null ? null : sets.problems[practice],
    similar: practice !== null && practice !== p,
    versions,
  }));
}

/**
 * Companies matching a search, Israeli ones first when `israeliFirst`.
 * @param {CompanySet[]} companies
 * @param {string} query
 * @param {{ israeliOnly?: boolean }} [opts]
 * @returns {CompanySet[]}
 */
export function filterCompanies(companies, query, { israeliOnly = false } = {}) {
  const q = query.trim().toLowerCase();
  return companies.filter((c) => (!israeliOnly || c.israeli) && (!q || c.name.toLowerCase().includes(q)));
}

/**
 * Progress on one company: how many of its rows can be practiced on the site and how many are solved.
 * @param {ReturnType<typeof expandRows>} rows
 * @param {(contentId: string) => boolean} isSolved
 * @returns {{ onSite: number, solved: number }}
 */
export function companyProgress(rows, isSolved) {
  const onSite = rows.filter((r) => r.practice);
  return { onSite: onSite.length, solved: onSite.filter((r) => isSolved(r.practice.contentId)).length };
}

/**
 * Two-letter mark for a company's option card (docs/DESIGN.md): initials of the first two words,
 * or the first two letters of a one-word name ("Check Point" -> "CP", "Nvidia" -> "Nv"). Letters,
 * not logos, so there is no trademark or asset to ship.
 * @param {string} name
 * @returns {string}
 */
export function monogram(name) {
  const words = String(name).trim().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);
  if (!words.length) return '?';
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0];
  // An acronym stays upper case ("IBM" -> "IB"); a word reads as a name ("nvidia" -> "Nv").
  return w === w.toUpperCase() ? w.slice(0, 2) : w[0].toUpperCase() + w.slice(1, 2).toLowerCase();
}

/**
 * A row's 0-100 frequency as a 3-step meter with a word, so the scale reads without colour. The
 * cut points split the shipped rows into rough thirds (about 63 and 75 at the time of writing).
 * @param {number} frequency
 * @param {'en'|'he'} [lang] the word's language (frequency, not difficulty: Hebrew translates it)
 * @returns {{ steps: 1|2|3, label: string }} label: 'High' | 'Medium' | 'Low' in English
 */
export function frequencyLevel(frequency, lang = 'en') {
  const he = lang === 'he';
  if (frequency >= 75) return { steps: 3, label: he ? 'גבוהה' : 'High' };
  if (frequency >= 60) return { steps: 2, label: he ? 'בינונית' : 'Medium' };
  return { steps: 1, label: he ? 'נמוכה' : 'Low' };
}
