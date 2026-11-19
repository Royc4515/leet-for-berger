import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoSync, installationFromUrl, createGitHubSync } from '../src/js/auth/github-sync.js';

test('auto sync: only practice, Accepted, not assisted, linked with auto on', () => {
  const link = { linked: true, autoSync: true };
  assert.equal(shouldAutoSync({ accepted: true, revealed: false, link, practice: true }), true);
  assert.equal(shouldAutoSync({ accepted: true, revealed: true, link, practice: true }), false, 'assisted is manual only');
  assert.equal(shouldAutoSync({ accepted: false, revealed: false, link, practice: true }), false);
  assert.equal(shouldAutoSync({ accepted: true, revealed: false, link: { linked: true, autoSync: false }, practice: true }), false);
  assert.equal(shouldAutoSync({ accepted: true, revealed: false, link: null, practice: true }), false);
  assert.equal(shouldAutoSync({ accepted: true, revealed: false, link, practice: false }), false, 'never inside an interview or battle');
});

test('installationFromUrl reads GitHub\'s setup redirect only', () => {
  assert.equal(installationFromUrl('?installation_id=123&setup_action=install'), 123);
  assert.equal(installationFromUrl('?installation_id=123'), null);
  assert.equal(installationFromUrl('?installation_id=abc&setup_action=install'), null);
  assert.equal(installationFromUrl(''), null);
});

test('client calls the function with the session token and the publishable key, and surfaces errors', async () => {
  const calls = [];
  const account = { config: { supabaseUrl: 'https://p.supabase.co', supabaseAnonKey: 'pk', githubAppSlug: 'lfb-sync', enabled: true }, accessToken: async () => 'jwt' };
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/push')) return new Response('{"error":"No repository connected"}', { status: 404 });
    return new Response('{"linked":true,"repo":"roy/practice","autoSync":true}', { status: 200 });
  };
  const sync = createGitHubSync({ account, fetchImpl });
  assert.equal(sync.available, true);
  assert.equal(sync.installUrl, 'https://github.com/apps/lfb-sync/installations/new');
  await sync.connect(7);
  assert.equal(sync.get().repo, 'roy/practice');
  assert.equal(calls[0].url, 'https://p.supabase.co/functions/v1/github-sync/link');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer jwt');
  assert.equal(calls[0].init.headers.apikey, 'pk');
  assert.deepEqual(JSON.parse(calls[0].init.body), { installationId: 7 });
  await assert.rejects(sync.push({}), /No repository connected/);
  const off = createGitHubSync({ account: { ...account, config: { ...account.config, githubAppSlug: '' } }, fetchImpl });
  assert.equal(off.available, false);
});

test('newRepoUrl prefills GitHub\'s new-repository page, private by default', async () => {
  const { newRepoUrl } = await import('../src/js/auth/github-sync.js');
  const u = new URL(newRepoUrl());
  assert.equal(u.origin + u.pathname, 'https://github.com/new');
  assert.equal(u.searchParams.get('name'), 'leetcode-solutions');
  assert.equal(u.searchParams.get('visibility'), 'private');
  assert.equal(new URL(newRepoUrl({ visibility: 'public' })).searchParams.get('visibility'), 'public');
  assert.equal(new URL(newRepoUrl({ visibility: 'weird' })).searchParams.get('visibility'), 'private');
});
