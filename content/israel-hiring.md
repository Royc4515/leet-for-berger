# Israel hiring relevance

`content/israel-hiring.json` rates every company in the problem metadata by how relevant it is for getting hired as a software engineer in Israel. Checked 2026-11.

Fields per company: `israel` (`major` / `present` / `none`), `tier` (1 top global, 2 strong tech, 3 other), `source` (required for `major` and `present`), optional `rankIL`, `unverified`, `aliasOf`.

## Method

- Company names are the exact strings in `src/js/data/problem-meta.json` and `src/js/data/company-sets.json` (273 names, the union of both).
- `major`: hundreds or more engineers, or a recognised Israeli R&D center or HQ. `present`: a smaller R&D site that hires engineers. `none`: no Israeli engineering hiring; sales-only offices count as none.
- Sources are web results from this check: the Wikipedia list of multinational R&D centers in Israel, Calcalist, Globes, ynet, Built In, company careers pages and Wikipedia company pages for Israeli firms.
- `unverified: true` on a `none` entry (only set for tier 1-2 companies) means no source was found, not that the company has no Israeli site. Treat those as "unknown, default none".
- Aliases in the metadata (Twitter/X, Citi/Citigroup, Snap/Snapchat, Navan/Tripactions, Hbo/Warnermedia, Wissen/Wissen Technology) are separate entries linked with `aliasOf`.
- `rankIL` is set only for Nvidia (1), where a source says it is becoming Israel's largest tech employer. No reliable per-company headcounts exist for the rest, so the table below is ordered by rough consensus, not measured.

## Known weak spots

- Several `major` entries cite a general source (the Wikipedia R&D list, DUNS 100 ranking) that confirms presence, not size. Their `major` label rests on public headcount estimates and should be re-checked.
- Rubrik and Palo Alto Networks rest on a DUNS 100 listing snippet (the page itself blocked automated fetches).
- Okta, MongoDB and Zscaler are `present` on thin evidence (acquisitions, a blog post, a careers benefits page).
- Many global companies with a possible Israeli site (Uber, Walmart, Wells Fargo, Goldman Sachs, Tesla, Cadence, LinkedIn, Databricks, Cloudflare, Stripe) were not confirmed and are `none` + `unverified`.

## Major list (approximate order, largest first)

| Company | Tier | rankIL | Source |
|---|---|---|---|
| Nvidia | 1 | 1 | https://www.jewishnews.co.uk/nvidia-set-to-become-israels-largest-tech-employer/ |
| Microsoft | 1 | | https://en.wikipedia.org/wiki/List_of_multinational_companies_with_research_and_development_centres_in_Israel |
| Intel | 2 | | same Wikipedia list |
| Google | 1 | | same Wikipedia list |
| Amazon | 1 | | same Wikipedia list |
| Apple | 1 | | same Wikipedia list |
| Meta | 1 | | same Wikipedia list |
| Wix | 2 | | https://www.ynetnews.com/business/article/ryt113f9xfx |
| Check Point | 2 | | https://en.wikipedia.org/wiki/Check_Point |
| Palo Alto Networks | 2 | | https://www.duns100.co.il/en/rating/High_Tech/Best_HighTech_Companies_to_work_for/2025 |
| Mobileye | 2 | | https://en.wikipedia.org/wiki/Mobileye |
| monday.com | 2 | | https://en.wikipedia.org/wiki/Monday.com |
| Amdocs | 2 | | https://en.wikipedia.org/wiki/Amdocs |
| CyberArk | 2 | | https://en.wikipedia.org/wiki/CyberArk |
| Cisco | 2 | | same Wikipedia list |
| Wiz | 2 | | https://en.wikipedia.org/wiki/Wiz,_Inc. |
| JFrog | 2 | | https://en.wikipedia.org/wiki/JFrog |
| Fiverr | 2 | | https://en.wikipedia.org/wiki/Fiverr |
| Salesforce | 2 | | same Wikipedia list |
| PayPal | 2 | | same Wikipedia list |
| SAP | 2 | | same Wikipedia list |
| IBM | 2 | | same Wikipedia list |
| Qualcomm | 2 | | same Wikipedia list |
| Samsung | 2 | | same Wikipedia list |
| Akamai | 2 | | https://www.calcalistech.com/ctechnews/article/byh1bufb11l |
| Taboola | 2 | | https://en.wikipedia.org/wiki/Taboola |
| Rubrik | 2 | | https://www.duns100.co.il/en/rating/High_Tech/Best_HighTech_Companies_to_work_for/2025 |

## How to update

1. Add or change the entry in `content/israel-hiring.json` (keep names identical to the metadata).
2. Give every `major` or `present` entry a `source` URL. If you cannot find one, use `none` with `"unverified": true`.
3. Run `node --test tests/israel-hiring.test.js`. It fails when a metadata company has no entry, a value is outside the allowed sets, or a major/present entry has no source.
4. Update the date at the top of this file and the `checked` field in the JSON.

After `scripts/content/build-meta.mjs` adds new companies, the test lists the missing names.
