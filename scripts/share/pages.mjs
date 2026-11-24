/**
 * The preview pages behind shared links (owner's request: each link shows its own preview).
 *
 * Chat apps build a link's preview from the page's Open Graph tags, without running JavaScript and
 * without the part after a #, so every route of this single-page site would show the same card.
 * Each shareable thing therefore gets a small static page under s/ (paths: SHARE_PAGES in
 * src/js/data/share.js) with its own title, description and image, which forwards a person to the
 * page itself at once. A personal result (a score, a streak) is in the shared message's text; the
 * preview is the page's, the same for everyone.
 *
 * Pure: data in, page descriptions and HTML out. scripts/share/build-share-pages.mjs writes the
 * files and renders the images on deploy (.github/workflows/pages.yml).
 */
import { SHARE_PAGES, SITE_NAME } from '../../src/js/data/share.js';

/**
 * @typedef {{ kind: string, eyebrow: string, title: string, sub: string, [key: string]: unknown }} Card
 *   what the image shows (scripts/share/card.html draws each kind)
 * @typedef {{ page: string, hash: string, title: string, description: string, image: string, alt: string, card: Card|null }} SharePage
 *   card is null when the page reuses another page's image
 */

// JPEG: the soft background glow makes a PNG about 200 KB, a JPEG at quality 85 a fraction of it.
const img = (page) => page.replace(/^s\//, 's/img/').replace(/\.html$/, '.jpg');
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const CODE_LANGUAGES = 'Python, JavaScript, TypeScript, Java, C++, C, C# or Go';

/**
 * Every preview page of the site.
 * @param {object} d
 * @param {{ id: string, title: string, difficulty: string, kind: string }[]} d.problems shipped problems
 * @param {Record<string, { topic: string, concept: string }>} d.placed where each problem sits on the map
 * @param {{ id: string, title: string, tier: number }[]} d.topics taxonomy topics
 * @param {(concept: string) => string} d.conceptTitle
 * @param {{ slug: string, name: string, onSite: number, israel: string, logo: string|null, letters: string, bleed?: boolean, color?: string|null }[]} d.companies
 * @param {{ total: number, tiers: number }} d.path
 * @param {{ topics: number, questions: number, daily: number }} d.quiz
 * @returns {SharePage[]}
 */
export function sharePages({ problems, placed, topics, conceptTitle, companies, path, quiz }) {
  const out = [];
  const topicOf = new Map(topics.map((t) => [t.id, t]));
  const problemPage = new Map();

  for (const p of problems) {
    const at = placed[p.id];
    const topic = at ? topicOf.get(at.topic) : null;
    const page = SHARE_PAGES.problem(p.id);
    const languages = p.kind === 'sql' ? 'SQL' : CODE_LANGUAGES;
    const entry = {
      page,
      hash: `#/problem/${p.id}`,
      title: `${p.title} (${p.difficulty})`,
      description: `${p.difficulty}${topic ? ` · ${topic.title}` : ''}. Solve it in the browser against 15 tests, in ${languages}.`,
      image: img(page),
      alt: `${p.title}, ${/^[aeiou]/i.test(p.difficulty) ? 'an' : 'a'} ${p.difficulty} interview problem${topic ? ` in ${topic.title}` : ''}`,
      card: { kind: 'problem', eyebrow: topic ? `Problem · ${topic.title}` : 'Problem', title: p.title, sub: `${p.difficulty} · 15 tests · ${p.kind === 'sql' ? 'SQL' : '8 languages'}`, difficulty: p.difficulty },
    };
    out.push(entry);
    problemPage.set(p.id, entry);
  }

  for (const c of companies) {
    const page = SHARE_PAGES.company(c.slug);
    const inIsrael = c.israel === 'major' || c.israel === 'present';
    out.push({
      page,
      hash: `#/companies/${c.slug}`,
      title: `${c.name} interview problems`,
      description: `${plural(c.onSite, 'of its most asked problem')} ready to practise in the browser, with a briefing on what ${c.name} asks.${inIsrael ? ' Hires engineers in Israel.' : ''}`,
      image: img(page),
      alt: `${c.name}: its most asked interview problems`,
      card: { kind: 'company', eyebrow: inIsrael ? (c.israel === 'major' ? 'Company · Major in Israel' : 'Company · Hires in Israel') : 'Company', title: c.name, sub: `${plural(c.onSite, 'most asked problem')} to practise`, logo: c.logo, letters: c.letters, bleed: Boolean(c.bleed), color: c.color ?? null },
    });
  }

  // The map: each topic, each subtopic in it, and each problem at its place (the problem's image).
  const byTopic = new Map();
  for (const p of problems) {
    const at = placed[p.id];
    if (!at || !topicOf.has(at.topic)) continue;
    if (!byTopic.has(at.topic)) byTopic.set(at.topic, new Map());
    const concepts = byTopic.get(at.topic);
    if (!concepts.has(at.concept)) concepts.set(at.concept, []);
    concepts.get(at.concept).push(p);
  }
  for (const [topicId, concepts] of byTopic) {
    const t = topicOf.get(topicId);
    const count = [...concepts.values()].reduce((n, ps) => n + ps.length, 0);
    const page = SHARE_PAGES.map({ topic: topicId });
    out.push({
      page,
      hash: `#/map/${topicId}`,
      title: `${t.title}: interview topics map`,
      description: `${plural(count, 'problem')} in ${plural(concepts.size, 'subtopic')}, in learning order, on a map of 26 interview topics.`,
      image: img(page),
      alt: `${t.title} on the interview topics map`,
      card: { kind: 'topic', eyebrow: `Map · Tier ${t.tier + 1}`, title: t.title, sub: `${plural(count, 'problem')} · ${plural(concepts.size, 'subtopic')}`, hexes: count },
    });
    for (const [conceptId, ps] of concepts) {
      const name = conceptTitle(conceptId);
      const cpage = SHARE_PAGES.map({ topic: topicId, concept: conceptId });
      out.push({
        page: cpage,
        hash: `#/map/${topicId}/${conceptId}`,
        title: `${name}: ${t.title}`,
        description: `${plural(ps.length, 'problem')} in ${t.title}, easy to hard, on a map of 26 interview topics.`,
        image: img(cpage),
        alt: `${name}, a subtopic of ${t.title}`,
        card: { kind: 'subtopic', eyebrow: `Map · ${t.title}`, title: name, sub: plural(ps.length, 'problem'), hexes: ps.length },
      });
      for (const p of ps) {
        const own = problemPage.get(p.id);
        out.push({ ...own, page: SHARE_PAGES.map({ topic: topicId, concept: conceptId, problem: p.id }), hash: `#/map/${topicId}/${conceptId}/${p.id}`, card: null });
      }
    }
  }

  const single = (page, hash, title, description, card) => out.push({ page, hash, title, description, image: img(page), alt: `${SITE_NAME}: ${title}`, card });
  single(SHARE_PAGES.path, '#/path', 'Learning path', `${path.total} problems, one per core interview pattern, in the order they build on each other.`, {
    kind: 'path',
    eyebrow: 'Learning path',
    title: 'One problem per core pattern',
    sub: `${path.total} problems · ${path.tiers} tiers`,
    tiers: path.tiers,
  });
  single(SHARE_PAGES.daily, '#/daily', 'Daily challenge', 'One problem a day, the same for everyone. Keep your streak going.', { kind: 'daily', eyebrow: 'Daily challenge', title: 'One problem a day', sub: 'The same for everyone · a new one at midnight' });
  single(SHARE_PAGES.interview, '#/modes', 'Mock interview', 'Timed mock interviews and online assessments: a score, a band and a review of every problem.', {
    kind: 'interview',
    eyebrow: 'Mock interview',
    title: 'Against the clock',
    sub: 'Interviews and online assessments · a score out of 100',
  });
  single(SHARE_PAGES.battle, '#/battle', 'Battle', 'Race a bot on the same problem: the first to pass all 15 tests wins.', { kind: 'battle', eyebrow: 'Battle', title: 'Race a bot', sub: 'Same problem · first to pass 15 tests wins' });
  single(SHARE_PAGES.quiz, '#/quiz', 'Interview quiz', `${quiz.questions} multiple-choice questions on what interviews test: OOP, data structures, databases, concurrency and more. In English or Hebrew, built for a phone.`, {
    kind: 'quiz',
    eyebrow: 'Quiz',
    title: 'Five spare minutes',
    sub: `${quiz.topics} topics · English or Hebrew`,
  });
  single(SHARE_PAGES.quizDaily, '#/quiz/daily', 'Daily quiz', `${quiz.daily} questions a day, the same for everyone. Share your squares, climb the leaderboard, keep your streak.`, {
    kind: 'quiz-daily',
    eyebrow: 'Daily quiz',
    title: `${quiz.daily} questions a day`,
    sub: 'The same for everyone · a new one at midnight',
    size: quiz.daily,
  });
  single(SHARE_PAGES.quizBoard, '#/quiz/board', 'Daily quiz leaderboard', 'Who scored best on the daily quiz today and this week. Only the first play counts, ties go to the faster player.', {
    kind: 'quiz-board',
    eyebrow: 'Daily quiz',
    title: 'Leaderboard',
    sub: 'Today and this week · first play counts',
  });
  return out;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * A preview page: Open Graph and Twitter tags for the preview, and an instant forward to the page.
 * @param {SharePage} p
 * @param {string} siteUrl the public site, ending in /
 * @returns {string}
 */
export function pageHtml(p, siteUrl) {
  const base = siteUrl.replace(/\/?$/, '/');
  const to = `${base}${p.hash}`;
  const tags = [
    ['og:type', 'website'],
    ['og:site_name', SITE_NAME],
    ['og:title', p.title],
    ['og:description', p.description],
    ['og:url', `${base}${p.page}`],
    ['og:image', `${base}${p.image}`],
    ['og:image:width', '1200'],
    ['og:image:height', '630'],
    ['og:image:alt', p.alt],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(p.title)} · ${SITE_NAME}</title>
<meta name="description" content="${esc(p.description)}">
${tags.map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${esc(`${base}${p.image}`)}">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>location.replace(${JSON.stringify(to).replace(/</g, '\\u003c')})</script>
</head>
<body style="background:#100f0d;color:#f3eee6;font-family:system-ui,sans-serif">
<p><a href="${esc(to)}" style="color:#f3a93c">${esc(p.title)}</a></p>
</body>
</html>
`;
}
