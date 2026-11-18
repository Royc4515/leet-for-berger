#!/usr/bin/env bash
# .NET SDK 8.0.428 (runtime 8.0.34), the CI toolchain's major version (actions/setup-dotnet, 8.0.x).
# Runs in the package directory; checksums are Microsoft's published SHA-512 values
# (dotnetcli release-metadata/8.0/releases.json).
set -euo pipefail
case "$(uname -m)" in
  aarch64) rid=linux-arm64; sha=bcc10091e404baaec01d538be8bd7125a33a8338594a6a795b1036128ace747a450d3f1482f16210b6a7ee937b911488676109156ec2c905ce31030badb1b0f2 ;;
  x86_64) rid=linux-x64; sha=33212bb99a2bf003973d41106c7e8fe94208a12958ff601d4a476be379403c85a7dc9183a6ec64dfb44ded7102965be09f35add1758e68e9251bae7891d7b7bf ;;
  *) echo "unsupported architecture $(uname -m)" >&2; exit 1 ;;
esac
curl -fsSL "https://builds.dotnet.microsoft.com/dotnet/Sdk/8.0.428/dotnet-sdk-8.0.428-${rid}.tar.gz" -o dotnet.tar.gz
echo "$sha  dotnet.tar.gz" | sha512sum -c -
tar xzf dotnet.tar.gz
rm dotnet.tar.gz
