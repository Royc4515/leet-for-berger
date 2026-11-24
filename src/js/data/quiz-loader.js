/**
 * Fetch loader for quiz questions: one JSON file per topic and language
 * (src/js/data/quiz/<lang>/<topic>.json, built by scripts/content/build-quiz.mjs). A session
 * loads only the topics its picked questions come from, and each file is fetched once per page
 * load.
 */

const cache = new Map();

/**
 * The questions of one topic in one language.
 * @param {string} topic
 * @param {'en'|'he'} lang
 * @returns {Promise<import('../modes/quiz.js').QuizQuestion[]>} rejects when the fetch fails
 */
export function loadQuizTopic(topic, lang) {
  const key = `${lang}/${topic}`;
  if (!cache.has(key)) {
    const p = fetch(new URL(`./quiz/${lang}/${topic}.json`, import.meta.url)).then((r) => {
      if (!r.ok) throw new Error(`quiz ${key}: HTTP ${r.status}`);
      return r.json();
    });
    // A failed fetch must not stay cached: the next attempt (after reconnecting) retries.
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key);
}

/**
 * The questions of several topics in one language, as one list.
 * @param {string[]} topics
 * @param {'en'|'he'} lang
 * @returns {Promise<import('../modes/quiz.js').QuizQuestion[]>}
 */
export async function loadQuizTopics(topics, lang) {
  const lists = await Promise.all(topics.map((t) => loadQuizTopic(t, lang)));
  return lists.flat();
}
