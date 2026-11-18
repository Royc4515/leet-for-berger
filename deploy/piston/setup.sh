#!/usr/bin/env bash
# One-command setup of the code runner on an Ubuntu 24.04 (Arm or x86-64) VM, e.g. an Oracle Cloud
# Always Free Ampere A1 instance. docs/DEPLOY_RUNNER.md walks through it; ADR 0005 explains why.
#
#   sudo ./setup.sh tunnel    preferred: Cloudflare Tunnel, no inbound port (needs TUNNEL_TOKEN)
#   sudo ./setup.sh public    fallback: HTTPS on 443 for a DuckDNS name (needs LFB_HOSTNAME)
#   sudo ./setup.sh           re-run with the mode chosen before (idempotent)
#
# TUNNEL_TOKEN or LFB_HOSTNAME is read from the environment the first time and kept in ./secrets.
# Safe to re-run at any time: it only changes what is missing or out of date.
set -euo pipefail
cd "$(dirname "$0")"
DEPLOY=$(pwd)
REPO=$(cd ../.. && pwd)
SECRETS="$DEPLOY/secrets"
say() { printf '\n== %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run with sudo"
. /etc/os-release
[ "${ID:-}" = ubuntu ] || echo "warning: tested on Ubuntu 24.04, this is ${PRETTY_NAME:-unknown}"
# isolate (Piston's sandbox) needs the unified cgroup v2 hierarchy, Ubuntu's default since 21.10.
[ "$(stat -fc %T /sys/fs/cgroup)" = cgroup2fs ] || die "cgroup v2 is required (unified hierarchy)"

mkdir -p "$SECRETS" data/packages data/caddy
chmod 700 "$SECRETS"
MODE=${1:-$(cat "$SECRETS/mode" 2>/dev/null || echo tunnel)}
case "$MODE" in tunnel|public) ;; *) die "mode must be tunnel or public" ;; esac
echo "$MODE" > "$SECRETS/mode"

say "Packages: Docker, Compose, automatic security updates"
export DEBIAN_FRONTEND=noninteractive
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  apt-get update -q
  # Ubuntu's own builds: their versions are fixed by the release, updated only for security.
  apt-get install -y -q docker.io docker-compose-v2
fi
apt-get install -y -q unattended-upgrades >/dev/null
systemctl enable --now docker unattended-upgrades >/dev/null

say "Hardening"
# Keys only for SSH (Oracle's images already do this; the drop-in keeps it true after upgrades).
if [ -d /etc/ssh/sshd_config.d ] && [ ! -f /etc/ssh/sshd_config.d/60-lfb.conf ]; then
  printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/60-lfb.conf
  systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
fi
# Swap absorbs a compile spike (dotnet build) instead of the kernel killing a job.
if ! swapon --show | grep -q /swapfile; then
  [ -f /swapfile ] || { fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null; }
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

say "Secrets in $SECRETS (mode 600, never committed)"
if [ ! -f "$SECRETS/gate.env" ]; then
  echo "LFB_RUNNER_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" > "$SECRETS/gate.env"
  NEW_SECRET=1
fi
if [ "$MODE" = tunnel ] && [ ! -f "$SECRETS/tunnel.env" ]; then
  [ -n "${TUNNEL_TOKEN:-}" ] || die "set TUNNEL_TOKEN (Cloudflare Zero Trust > Networks > Tunnels > your tunnel > install command)"
  echo "TUNNEL_TOKEN=$TUNNEL_TOKEN" > "$SECRETS/tunnel.env"
fi
if [ "$MODE" = public ] && [ ! -f "$SECRETS/public.env" ]; then
  [ -n "${LFB_HOSTNAME:-}" ] || die "set LFB_HOSTNAME (your DuckDNS name, e.g. lfb-runner.duckdns.org)"
  echo "LFB_HOSTNAME=$LFB_HOSTNAME" > "$SECRETS/public.env"
fi
touch "$SECRETS/tunnel.env" "$SECRETS/public.env"
chmod 600 "$SECRETS"/*.env

say "Firewall"
# Piston (2000) and the gate (8080) bind 127.0.0.1 only. Tunnel mode needs no inbound port at all;
# public mode opens 443 here, and the owner adds the matching ingress rule in Oracle's console.
if [ "$MODE" = public ]; then
  if ! iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
    command -v netfilter-persistent >/dev/null && netfilter-persistent save >/dev/null || true
  fi
fi

say "Piston image (built from source at a pinned commit; the first build takes a few minutes)"
docker compose build piston

say "Runtimes: Java 21, GCC 12 (C, C++), .NET 8, Go 1.23 (pinned, checksum-verified)"
docker compose run --rm --no-deps --entrypoint bash piston /lfb/install-packages.sh

say "Start"
PROFILE=$([ "$MODE" = tunnel ] && echo tunnel || echo public)
docker compose --profile "$PROFILE" up -d --remove-orphans
for _ in $(seq 1 60); do
  docker compose exec -T gate node -e "fetch('http://127.0.0.1:8080/v1/health',{headers:{'X-LFB-Secret':process.env.LFB_RUNNER_SECRET}}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))" && break
  sleep 2
done

say "Listening sockets (2000 and 8080 must be 127.0.0.1 only)"
ss -ltnp | grep -E ':(2000|8080|443) ' || true
if ss -ltn | grep -E ':(2000|8080) ' | grep -vq '127.0.0.1'; then die "Piston or the gate listens on a public address"; fi

say "Smoke test: shipped solutions in all five languages through the gate"
docker compose run --rm --no-deps -v "$REPO:/repo:ro" --entrypoint node gate /repo/deploy/piston/smoke.mjs --gate http://127.0.0.1:8080

if [ "${NEW_SECRET:-0}" = 1 ]; then
  say "New shared secret. Give it to the Worker once (docs/DEPLOY_RUNNER.md, step 'Deploy the Worker'):"
  cut -d= -f2 "$SECRETS/gate.env"
fi
say "Done. Containers restart on their own after a crash or a reboot (restart: unless-stopped)."
