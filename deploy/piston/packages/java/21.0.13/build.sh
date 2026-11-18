#!/usr/bin/env bash
# Eclipse Temurin JDK 21.0.13+9, the CI toolchain's major version (actions/setup-java, java-version 21).
# Runs in the package directory; checksums are Adoptium's published SHA-256 values.
set -euo pipefail
case "$(uname -m)" in
  aarch64) arch=aarch64; sha=e3522e707fc7dbe2a72c30746b1e7068301a0213ecd213d4491f35a14eb55578 ;;
  x86_64) arch=x64; sha=d7f5d5cf865a2902b70ff549b97586a7d3f234e016f041ab447ea740c7d66d1c ;;
  *) echo "unsupported architecture $(uname -m)" >&2; exit 1 ;;
esac
curl -fsSL "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jdk_${arch}_linux_hotspot_21.0.13_9.tar.gz" -o jdk.tar.gz
echo "$sha  jdk.tar.gz" | sha256sum -c -
tar xzf jdk.tar.gz --strip-components=1
rm jdk.tar.gz
