#!/usr/bin/env bash
# Downloads the public datasets the problem index is built from into content/.cache (gitignored).
# Usage: bash scripts/content/fetch-sources.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
CACHE=content/.cache
mkdir -p "$CACHE"

# Company tags: one folder per company, CSVs per recency window.
if [ -d "$CACHE/companies/.git" ]; then
  git -C "$CACHE/companies" pull -q --ff-only
else
  git clone -q --depth 1 https://github.com/liquidslr/leetcode-company-wise-problems.git "$CACHE/companies"
fi

# Contest-based numeric difficulty (Elo-like) per problem.
curl -sSfL -o "$CACHE/ratings.txt" https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/ratings.txt

# NeetCode problem list with pattern and Blind 75 / NeetCode 150 membership.
curl -sSfL -o "$CACHE/neetcode.json" https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json

# Second company dataset: more companies (incl. Israeli ones), LeetCode problem numbers.
if [ -d "$CACHE/companies2/.git" ]; then
  git -C "$CACHE/companies2" pull -q --ff-only
else
  git clone -q --depth 1 https://github.com/snehasishroy/leetcode-companywise-interview-questions.git "$CACHE/companies2"
fi

# Public solutions index whose README lists LeetCode's Top Interview 150 study plan.
curl -sSfL -o "$CACHE/lij.md" https://raw.githubusercontent.com/javadev/LeetCode-in-Java/main/README.md

echo "sources in $CACHE"
