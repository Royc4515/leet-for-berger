/**
 * GitHub sync, server side (ADR 0007): runs in a Supabase Edge Function (Deno), and in Node for
 * the unit tests. Everything that talks to the network is injected.
 *
 * Routes (all need the user's Supabase session as a Bearer token):
 *   GET  /status                  the user's link, or { linked: false }
 *   POST /link   { installationId }   verifies the installation belongs to this GitHub user, stores it
 *   POST /push   { problemId, title, ... }   one commit with the solution and the problem's README
 *   POST /settings { autoSync }   on/off for automatic sync after Accepted
 *   POST /unlink                  forgets the link (the user uninstalls the app on GitHub)
 */

const GITHUB = 'https://api.github.com';
const MAX_CODE = 100_000;

/** File extension per site language. */
export const EXTENSIONS = { python: 'py', javascript: 'js', typescript: 'ts', java: 'java', cpp: 'cpp', c: 'c', csharp: 'cs', go: 'go', sql: 'sql' };

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlText = (s) => b64url(new TextEncoder().encode(s));

/**
 * DER bytes of a PKCS#8 private key from a PEM. GitHub hands out PKCS#1 ("BEGIN RSA PRIVATE KEY"),
 * which WebCrypto cannot import, so that form is wrapped in the PKCS#8 envelope here.
 * @param {string} pem
 * @returns {Uint8Array}
 */
export function pemToPkcs8(pem) {
  const pkcs1 = /BEGIN RSA PRIVATE KEY/.test(pem);
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  if (!pkcs1) return der;
  // PrivateKeyInfo ::= SEQUENCE { version 0, AlgorithmIdentifier rsaEncryption NULL, OCTET STRING pkcs1 }
  const len = (n) => (n < 0x80 ? [n] : n < 0x100 ? [0x81, n] : n < 0x10000 ? [0x82, n >> 8, n & 0xff] : [0x83, n >> 16, (n >> 8) & 0xff, n & 0xff]);
  const algo = [0x02, 0x01, 0x00, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const octet = [0x04, ...len(der.length)];
  const inner = algo.length + octet.length + der.length;
  return Uint8Array.from([0x30, ...len(inner), ...algo, ...octet, ...der]);
}

/**
 * A GitHub App JWT (RS256), valid 9 minutes, backdated 60 s for clock drift.
 * @param {{ appId: string, privateKeyPem: string, now?: number, subtle?: SubtleCrypto }} p
 */
export async function createAppJwt({ appId, privateKeyPem, now = Date.now(), subtle = globalThis.crypto.subtle }) {
  const iat = Math.floor(now / 1000) - 60;
  const head = b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64urlText(JSON.stringify({ iat, exp: iat + 9 * 60, iss: String(appId) }));
  const key = await subtle.importKey('pkcs8', pemToPkcs8(privateKeyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}

/** Repository path of a solution. Ids are validated before they reach here. */
export function solutionPath(problemId, language) {
  return `problems/${problemId}/solution.${EXTENSIONS[language]}`;
}

/**
 * The problem's README in the user's repository.
 * @param {{ problemId: string, title: string, difficulty?: string, language: string, verdict: string, passed?: number, total?: number,
 *   assisted?: boolean, at: string, complexity?: string, siteUrl: string }} s
 */
export function readmeFor(s) {
  const lines = [
    `# ${s.title}`,
    '',
    `${s.difficulty ? `**${s.difficulty}**, ` : ''}solved in ${s.language}, ${s.at.slice(0, 10)}.`,
    '',
    `- Verdict: ${s.verdict}${s.total ? ` (${s.passed}/${s.total} tests)` : ''}`,
  ];
  if (s.complexity) lines.push(`- Complexity: ${s.complexity}`);
  if (s.assisted) lines.push('- Assisted: solved after revealing the reference solution');
  lines.push(`- Problem: ${s.siteUrl.replace(/\/+$/, '')}/#/problem/${s.problemId}`, '', '_Synced by Leet-For-Berger._', '');
  return lines.join('\n');
}

/** What is wrong with a push request, or null. Inputs come from the browser, so everything is checked. */
export function validatePush(b) {
  if (!b || typeof b !== 'object') return 'Body must be JSON';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.problemId ?? '') || b.problemId.length > 80) return 'Bad problemId';
  if (!EXTENSIONS[b.language]) return 'Bad language';
  if (typeof b.code !== 'string' || !b.code.trim()) return 'Code is empty';
  if (b.code.length > MAX_CODE) return `Code over ${MAX_CODE} characters`;
  if (typeof b.title !== 'string' || !b.title || b.title.length > 120) return 'Bad title';
  if (typeof b.verdict !== 'string' || b.verdict.length > 60) return 'Bad verdict';
  return null;
}

/** GitHub user id of a Supabase user who signed in (or linked) with GitHub, or null. */
export function githubIdOf(user) {
  const id = user?.identities?.find((i) => i.provider === 'github');
  const raw = id?.identity_data?.provider_id ?? id?.identity_data?.sub ?? id?.id;
  return raw ? String(raw) : null;
}

/**
 * @param {{
 *   appId: string, privateKeyPem: string, siteUrl: string,
 *   fetchImpl: typeof fetch,
 *   getUser: (bearer: string) => Promise<any|null>,
 *   links: { get: (userId: string) => Promise<any|null>, put: (row: any) => Promise<void>, remove: (userId: string) => Promise<void> },
 *   now?: () => number,
 * }} deps
 * @returns {(request: Request) => Promise<Response>}
 */
export function createHandler({ appId, privateKeyPem, siteUrl, fetchImpl, getUser, links, now = Date.now }) {
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  async function gh(path, { token, method = 'GET', body } = {}) {
    const res = await fetchImpl(`${GITHUB}${path}`, {
      method,
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'leet-for-berger-sync', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(`GitHub ${method} ${path.split('?')[0]}: ${res.status} ${data?.message ?? ''}`.trim()), { status: res.status });
    return data;
  }
  const appToken = () => createAppJwt({ appId, privateKeyPem, now: now() });
  const installationToken = async (installationId) => (await gh(`/app/installations/${installationId}/access_tokens`, { token: await appToken(), method: 'POST' })).token;

  /** One commit with several files, through the Git data API (contents API would make one commit per file). */
  async function commitFiles(token, repo, files, message) {
    const meta = await gh(`/repos/${repo}`, { token });
    const branch = meta.default_branch;
    let parent = null;
    let baseTree;
    try {
      const ref = await gh(`/repos/${repo}/git/ref/heads/${branch}`, { token });
      parent = ref.object.sha;
      baseTree = (await gh(`/repos/${repo}/git/commits/${parent}`, { token })).tree.sha;
    } catch (err) {
      // An empty repository has no branch yet: the first commit creates it.
      if (err.status !== 404 && err.status !== 409) throw err;
    }
    const tree = await gh(`/repos/${repo}/git/trees`, { token, method: 'POST', body: { ...(baseTree ? { base_tree: baseTree } : {}), tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })) } });
    const commit = await gh(`/repos/${repo}/git/commits`, { token, method: 'POST', body: { message, tree: tree.sha, parents: parent ? [parent] : [] } });
    if (parent) await gh(`/repos/${repo}/git/refs/heads/${branch}`, { token, method: 'PATCH', body: { sha: commit.sha } });
    else await gh(`/repos/${repo}/git/refs`, { token, method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } });
    return { sha: commit.sha, url: `https://github.com/${repo}/commit/${commit.sha}` };
  }

  return async function handle(request) {
    const route = new URL(request.url).pathname.replace(/^.*\/github-sync/, '') || '/';
    const bearer = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const user = bearer ? await getUser(bearer) : null;
    if (!user) return json(401, { error: 'Sign in first' });

    try {
      if (request.method === 'GET' && route === '/status') {
        const link = await links.get(user.id);
        return json(200, link ? { linked: true, repo: link.repo, autoSync: link.auto_sync } : { linked: false, githubUser: Boolean(githubIdOf(user)) });
      }
      if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
      const body = await request.json().catch(() => ({}));

      if (route === '/link') {
        const githubId = githubIdOf(user);
        if (!githubId) return json(403, { error: 'Sign in with GitHub to connect a repository' });
        const installationId = Number(body.installationId);
        if (!Number.isSafeInteger(installationId) || installationId <= 0) return json(400, { error: 'Bad installationId' });
        // The installation id arrives in a URL anyone could edit: only the account it was installed on may claim it.
        const inst = await gh(`/app/installations/${installationId}`, { token: await appToken() });
        if (String(inst.account?.id) !== githubId) return json(403, { error: 'That installation belongs to another GitHub account' });
        const token = await installationToken(installationId);
        const { repositories = [] } = await gh('/installation/repositories?per_page=2', { token });
        if (repositories.length !== 1) return json(409, { error: 'Give the app access to exactly one repository (GitHub: Settings > Applications > Leet-For-Berger > Configure)' });
        const row = { user_id: user.id, installation_id: installationId, repo: repositories[0].full_name, auto_sync: true };
        await links.put(row);
        return json(200, { linked: true, repo: row.repo, autoSync: true });
      }

      if (route === '/settings') {
        const link = await links.get(user.id);
        if (!link) return json(404, { error: 'No repository connected' });
        await links.put({ ...link, auto_sync: Boolean(body.autoSync) });
        return json(200, { linked: true, repo: link.repo, autoSync: Boolean(body.autoSync) });
      }

      if (route === '/unlink') {
        await links.remove(user.id);
        return json(200, { linked: false });
      }

      if (route === '/push') {
        const problem = validatePush(body);
        if (problem) return json(400, { error: problem });
        const link = await links.get(user.id);
        if (!link) return json(404, { error: 'No repository connected' });
        const token = await installationToken(link.installation_id);
        const at = new Date(now()).toISOString();
        const files = [
          { path: solutionPath(body.problemId, body.language), content: body.code.endsWith('\n') ? body.code : `${body.code}\n` },
          { path: `problems/${body.problemId}/README.md`, content: readmeFor({ ...body, at, siteUrl }) },
        ];
        const tag = body.assisted ? ' (assisted)' : '';
        const result = await commitFiles(token, link.repo, files, `${body.title}: ${body.verdict} in ${body.language}${tag}`);
        return json(200, { ok: true, repo: link.repo, ...result });
      }
      return json(404, { error: 'Not found' });
    } catch (err) {
      // GitHub said no (uninstalled app, repository gone, permissions): tell the user, never a 500 stack.
      return json(502, { error: err.message });
    }
  };
}
