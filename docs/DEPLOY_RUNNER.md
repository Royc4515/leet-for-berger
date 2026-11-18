# Deploy the code runner (Java, C++, C, C#, Go)

This turns on server execution for the five compiled languages, at $0. Design and threat model: [ADR 0005](adr/0005-remote-runner.md). About an hour, most of it waiting for builds.

Steps marked **[owner]** need you personally: an account, a card check, or a login. Everything else is a copy-paste command.

What you end up with:

```
site (GitHub Pages) -> Cloudflare Worker (free) -> Cloudflare Tunnel -> Oracle VM (Always Free): gate -> Piston
```

The VM keeps every inbound port closed except SSH. No domain is needed.

## 1. Oracle Cloud account [owner]

1. Sign up at <https://www.oracle.com/cloud/free/>. A card is asked for identity verification only; a Free Tier account is never charged.
2. Pick the **home region** carefully: it cannot be changed, and Arm capacity differs by region. A region near your users with A1 availability is best.

## 2. Create the VM [owner]

In the Oracle console: **Compute > Instances > Create instance**.

| Field | Value |
|---|---|
| Image | Canonical Ubuntu 24.04 (the aarch64 build is picked automatically for Arm) |
| Shape | Ampere, `VM.Standard.A1.Flex`, **2 OCPUs, 12 GB memory** (the whole free allowance) |
| Boot volume | 50 GB (default) |
| Networking | default VCN, public IPv4 address: yes (for SSH only) |
| SSH keys | upload your public key, or download the generated one |

"Out of capacity" is common for A1: try another availability domain, or again later.

Note the public IP, then:

```bash
ssh ubuntu@VM_IP
```

## 3. Get the repository onto the VM

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/YOUR-GITHUB-USER/leet-for-berger.git
```

For a private repository, add a read-only deploy key (GitHub: repository Settings > Deploy keys) or copy it with `scp -r`.

## 4. Cloudflare account and tunnel [owner]

1. Sign up at <https://dash.cloudflare.com/sign-up> (free, no card).
2. **Zero Trust > Networks > Tunnels > Create a tunnel**, type **Cloudflared**, name `lfb-runner`.
3. On the install page, copy the token: the long string after `--token` in the shown command. Do not run that command; setup does it in a container.
4. Skip "public hostname": the Worker reaches the tunnel privately (step 6).
5. Note the **tunnel ID** shown in the tunnel list.

## 5. Run the setup on the VM

```bash
cd ~/leet-for-berger/deploy/piston
sudo TUNNEL_TOKEN='PASTE-THE-TOKEN' ./setup.sh tunnel
```

It installs Docker, hardens SSH, adds swap, builds the Piston image from source, installs Java 21, GCC 12, .NET 8 and Go 1.23 (checksums verified), starts everything, checks that nothing listens publicly, and runs shipped solutions in all five languages. It ends with:

```
All runs Accepted.
== New shared secret. Give it to the Worker once ...
3f9c...   (64 hex characters)
```

Keep that secret for step 6. It is stored on the VM in `deploy/piston/secrets/gate.env` (mode 600).

Re-running `sudo ./setup.sh` is safe at any time (after a reboot, an update or a change).

## 6. Deploy the Worker

On your laptop (or the VM), with Node 22:

```bash
cd leet-for-berger/deploy/cloudflare-worker
npm install               # installs the pinned wrangler
npx wrangler login        # [owner] opens the browser
```

Create the private link from the Worker to the gate through the tunnel:

```bash
npx wrangler vpc service create lfb-gate --type http --http-port 8080 --ipv4 127.0.0.1 --tunnel-id YOUR-TUNNEL-ID
```

(Or in the dashboard: **Workers VPC > Create VPC service**, type HTTP, tunnel `lfb-runner`, IPv4 `127.0.0.1`, HTTP port `8080`.) Copy the service ID it prints.

Edit `wrangler.toml`:

- `ALLOWED_ORIGINS`: your Pages origin, e.g. `https://YOUR-GITHUB-USER.github.io` (keep `http://localhost:5173` for local testing).
- `service_id` under `[[vpc_services]]`: the ID from above.

Set the secret and deploy:

```bash
npx wrangler secret put RUNNER_SECRET     # paste the secret from step 5
npx wrangler deploy
```

The first deploy asks you to choose a `workers.dev` subdomain **[owner]**. The Worker's URL is printed, e.g. `https://lfb-runner.YOUR-SUBDOMAIN.workers.dev`.

## 7. Point the site at the Worker

In `src/js/config.js`:

```js
export const REMOTE_RUNNER = {
  url: 'https://lfb-runner.YOUR-SUBDOMAIN.workers.dev',
  turnstileSiteKey: '',
};
```

Commit and push to `main`; GitHub Pages redeploys. The URL is public by design: the secret stays between the Worker and the VM.

## 8. Verify

From your laptop:

```bash
node deploy/piston/smoke.mjs --worker https://lfb-runner.YOUR-SUBDOMAIN.workers.dev --origin https://YOUR-GITHUB-USER.github.io
```

Expect `All runs Accepted.` Then open the site, pick a problem, choose **Java**: the toolbar shows "Runs on the server". Reveal Solution, Submit: Accepted 15/15.

## Optional

### Turnstile (if bots abuse the Worker)

1. **[owner]** Cloudflare dashboard: **Turnstile > Add widget**, mode **Invisible**, hostname `YOUR-GITHUB-USER.github.io`. You get a site key (public) and a secret key.
2. `npx wrangler secret put TURNSTILE_SECRET` (the secret key), then `npx wrangler deploy`.
3. `turnstileSiteKey` in `src/js/config.js` (the site key), commit.

### Keep the VM from being reclaimed

Oracle may reclaim an Always Free instance that stays idle (under 20% CPU, network and memory) for 7 days, and a practice runner is mostly idle. **[owner]** Upgrading the account to Pay As You Go (Billing > Upgrade) keeps the Always Free resources free and is the documented way out; add a $1 budget alert (Billing > Budgets) and create nothing outside the Always Free shapes. Otherwise: if the instance disappears, repeat steps 2, 3 and 5 (about 20 minutes, same secret if you keep `secrets/gate.env`). Meanwhile the site says the code server is offline for these five languages; everything else keeps working.

### Without a tunnel (fallback)

If Workers VPC is not available to you, expose the gate over HTTPS instead:

1. **[owner]** Get a free name at <https://www.duckdns.org> pointing at the VM's IP.
2. **[owner]** Oracle console: the VM's subnet > security list > add an ingress rule for TCP 443 from `0.0.0.0/0`.
3. `sudo LFB_HOSTNAME=YOUR-NAME.duckdns.org ./setup.sh public` (Caddy gets a Let's Encrypt certificate; only port 443 opens).
4. In `wrangler.toml`, remove the `[[vpc_services]]` block and set `GATE_URL = "https://YOUR-NAME.duckdns.org"`, then deploy.

The gate still rejects any request without the shared secret.

## Operate

```bash
cd ~/leet-for-berger/deploy/piston
sudo docker compose ps                       # what runs
sudo docker compose logs -f gate             # one line per run: language, time, exit status
sudo docker compose --profile tunnel restart # restart everything
```

- **Monitoring**: `.github/workflows/runner-health.yml` calls the Worker's `/v1/health?deep=1` every 6 hours, which asks the gate on the VM for Piston's runtimes. A failed run (GitHub emails you) means the VM, the tunnel or Piston is down; recover with the steps above or a new VM and `sudo ./setup.sh tunnel`. Check by hand: `node scripts/runner-health.mjs`. After changing the Worker, redeploy it (`cd deploy/cloudflare-worker && npx wrangler deploy`); until then the check only warns.
- **Rotate the secret**: `sudo rm secrets/gate.env && sudo ./setup.sh`, then `npx wrangler secret put RUNNER_SECRET` with the new value.
- **Update the runtimes or Piston**: change the pinned versions in the repo (packages, Dockerfile, gate `RUNTIMES`, `tests/runner-deploy.test.js` keeps them consistent), pull on the VM, `sudo ./setup.sh`.
- **Free tier limits**: 100,000 Worker requests per day (failures until 00:00 UTC past that, never a bill); 2 OCPUs and 12 GB on the VM, two jobs at a time.
