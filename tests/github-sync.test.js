// GitHub sync Edge Function core (deploy/supabase/functions/github-sync/core.js, ADR 0007).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { pemToPkcs8, createAppJwt, solutionPath, readmeFor, validatePush, githubIdOf, createHandler, EXTENSIONS } from '../deploy/supabase/functions/github-sync/core.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pkcs1 = privateKey.export({ type: 'pkcs1', format: 'pem' });
const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'pem' });

test('the PKCS#1 key GitHub hands out is wrapped into the PKCS#8 WebCrypto needs', () => {
  const der8 = Buffer.from(pkcs8.replace(/-----[^-]+-----|\s/g, ''), 'base64');
  assert.deepEqual(Buffer.from(pemToPkcs8(pkcs1)), der8);
  assert.deepEqual(Buffer.from(pemToPkcs8(pkcs8)), der8);
});

test('createAppJwt: RS256, verifiable with the public key, issuer and a short life', async () => {
  const jwt = await createAppJwt({ appId: '12345', privateKeyPem: pkcs1, now: 1_700_000_000_000 });
  const [h, b, s] = jwt.split('.');
  const verify = createVerify('RSA-SHA256');
  verify.update(`${h}.${b}`);
  assert.ok(verify.verify(publicKey, Buffer.from(s, 'base64url')));
  const claims = JSON.parse(Buffer.from(b, 'base64url'));
  assert.equal(claims.iss, '12345');
  assert.equal(claims.exp - claims.iat, 540);
  assert.equal(claims.iat, 1_700_000_000 - 60);
});

test('paths, README and input validation', () => {
  assert.equal(solutionPath('pair-sum-target', 'python'), 'problems/pair-sum-target/solution.py');
  assert.equal(Object.keys(EXTENSIONS).length, 9);
  const md = readmeFor({ problemId: 'pair-sum-target', title: 'Pair Sum Target', difficulty: 'Easy', language: 'python', verdict: 'Accepted', passed: 15, total: 15, at: '2026-11-19T10:00:00Z', siteUrl: 'https://site.example/', assisted: true });
  assert.match(md, /^# Pair Sum Target/);
  assert.match(md, /15\/15 tests/);
  assert.match(md, /Assisted/);
  assert.match(md, /https:\/\/site\.example\/#\/problem\/pair-sum-target/);
  const ok = { problemId: 'pair-sum-target', language: 'python', code: 'x', title: 'T', verdict: 'Accepted' };
  assert.equal(validatePush(ok), null);
  assert.match(validatePush({ ...ok, problemId: '../etc' }), /problemId/);
  assert.match(validatePush({ ...ok, language: 'rust' }), /language/);
  assert.match(validatePush({ ...ok, code: 'x'.repeat(100_001) }), /Code over/);
  assert.equal(githubIdOf({ identities: [{ provider: 'google' }, { provider: 'github', identity_data: { provider_id: '42' } }] }), '42');
  assert.equal(githubIdOf({ identities: [{ provider: 'google' }] }), null);
});

/** A fake GitHub: an app installation 7 on account 42 with one repo, recording calls. */
function fakeGitHub({ accountId = 42, repos = [{ full_name: 'roy/practice' }], emptyRepo = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const path = url.replace('https://api.github.com', '');
    const method = init.method ?? 'GET';
    calls.push({ method, path, body: init.body ? JSON.parse(init.body) : null, auth: init.headers.Authorization });
    const ok = (body, status = 200) => new Response(JSON.stringify(body), { status });
    if (path === '/app/installations/7') return ok({ id: 7, account: { id: accountId } });
    if (path === '/app/installations/7/access_tokens') return ok({ token: 'inst-token' }, 201);
    if (path.startsWith('/installation/repositories')) return ok({ repositories: repos });
    if (path === '/repos/roy/practice') return ok({ default_branch: 'main' });
    if (path === '/repos/roy/practice/git/ref/heads/main') return emptyRepo ? ok({ message: 'Git Repository is empty.' }, 409) : ok({ object: { sha: 'parent' } });
    if (path === '/repos/roy/practice/git/commits/parent') return ok({ tree: { sha: 'base-tree' } });
    if (path === '/repos/roy/practice/git/trees') return ok({ sha: 'new-tree' }, 201);
    if (path === '/repos/roy/practice/git/commits') return ok({ sha: 'new-commit' }, 201);
    if (path.startsWith('/repos/roy/practice/git/refs')) return ok({}, 200);
    return ok({ message: 'Not Found' }, 404);
  };
  return { calls, fetchImpl };
}
function setup(opts = {}) {
  const gh = fakeGitHub(opts);
  const rows = new Map(opts.rows ?? []);
  const user = opts.user === undefined ? { id: 'u1', identities: [{ provider: 'github', identity_data: { provider_id: '42' } }] } : opts.user;
  const handle = createHandler({
    appId: '1',
    privateKeyPem: pkcs1,
    siteUrl: 'https://royc4515.github.io/leet-for-berger/',
    fetchImpl: gh.fetchImpl,
    getUser: async (bearer) => (bearer === 'good' ? user : null),
    links: { get: async (id) => rows.get(id) ?? null, put: async (r) => void rows.set(r.user_id, r), remove: async (id) => void rows.delete(id) },
    now: () => Date.parse('2026-11-19T10:00:00Z'),
  });
  const call = (route, body, { token = 'good', method = body ? 'POST' : 'GET' } = {}) =>
    handle(new Request(`https://x.supabase.co/functions/v1/github-sync${route}`, { method, headers: { Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined }));
  return { ...gh, rows, call };
}

test('requests without a valid session are refused', async () => {
  const { call } = setup();
  assert.equal((await call('/status', null, { token: 'bad' })).status, 401);
});

test('link: only the GitHub account the app was installed on can claim it, and it must grant exactly one repo', async () => {
  const mine = setup();
  const res = await mine.call('/link', { installationId: 7 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { linked: true, repo: 'roy/practice', autoSync: true });
  assert.equal(mine.rows.get('u1').installation_id, 7);

  const someoneElse = setup({ accountId: 99 });
  assert.equal((await someoneElse.call('/link', { installationId: 7 })).status, 403);
  assert.equal(someoneElse.rows.size, 0);

  const googleOnly = setup({ user: { id: 'u2', identities: [{ provider: 'google' }] } });
  assert.equal((await googleOnly.call('/link', { installationId: 7 })).status, 403);

  const twoRepos = setup({ repos: [{ full_name: 'a/b' }, { full_name: 'c/d' }] });
  assert.equal((await twoRepos.call('/link', { installationId: 7 })).status, 409);
});

test('push: one commit with the solution and the README, on top of the branch', async () => {
  const s = setup({ rows: [['u1', { user_id: 'u1', installation_id: 7, repo: 'roy/practice', auto_sync: true }]] });
  const res = await s.call('/push', { problemId: 'pair-sum-target', language: 'python', code: 'def f(): pass', title: 'Pair Sum Target', verdict: 'Accepted', passed: 15, total: 15 });
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.url, 'https://github.com/roy/practice/commit/new-commit');
  const tree = s.calls.find((c) => c.path.endsWith('/git/trees'));
  assert.equal(tree.body.base_tree, 'base-tree');
  assert.deepEqual(tree.body.tree.map((f) => f.path), ['problems/pair-sum-target/solution.py', 'problems/pair-sum-target/README.md']);
  const commit = s.calls.find((c) => c.path.endsWith('/git/commits') && c.method === 'POST');
  assert.deepEqual(commit.body.parents, ['parent']);
  assert.equal(commit.body.message, 'Pair Sum Target: Accepted in python');
  assert.ok(s.calls.some((c) => c.method === 'PATCH' && c.path.endsWith('/git/refs/heads/main')));
  // Repository calls use the installation token, never the app JWT.
  assert.ok(s.calls.filter((c) => c.path.startsWith('/repos/')).every((c) => c.auth === 'Bearer inst-token'));
});

test('push into an empty repository creates the branch', async () => {
  const s = setup({ emptyRepo: true, rows: [['u1', { user_id: 'u1', installation_id: 7, repo: 'roy/practice', auto_sync: true }]] });
  const res = await s.call('/push', { problemId: 'p', language: 'go', code: 'package main', title: 'P', verdict: 'Accepted' });
  assert.equal(res.status, 200);
  assert.deepEqual(s.calls.find((c) => c.path.endsWith('/git/commits') && c.method === 'POST').body.parents, []);
  assert.ok(s.calls.some((c) => c.method === 'POST' && c.path === '/repos/roy/practice/git/refs'));
});

test('push without a link, or with bad input, writes nothing; settings and unlink', async () => {
  const s = setup();
  assert.equal((await s.call('/push', { problemId: 'p', language: 'python', code: 'x', title: 'T', verdict: 'Accepted' })).status, 404);
  assert.equal((await s.call('/push', { problemId: '../x', language: 'python', code: 'x', title: 'T', verdict: 'Accepted' })).status, 400);
  assert.ok(!s.calls.some((c) => c.path.startsWith('/repos/')));
  await s.call('/link', { installationId: 7 });
  assert.deepEqual(await (await s.call('/settings', { autoSync: false })).json(), { linked: true, repo: 'roy/practice', autoSync: false });
  assert.equal(s.rows.get('u1').auto_sync, false);
  await s.call('/unlink', {});
  assert.deepEqual(await (await s.call('/status')).json(), { linked: false, githubUser: true });
});
