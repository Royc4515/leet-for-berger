# Israel hiring relevance

`content/israel-hiring.json` rates every company in the problem metadata by how relevant it is for getting hired as a software engineer in Israel. Checked 2026-11 (second pass).

Fields per company: `israel` (`major` / `present` / `none`), `tier` (1 top global, 2 strong tech, 3 other), `source` (required for `major` and `present`), optional `rankIL`, `unverified`, `aliasOf`.

## Definitions

- `major`: roughly 500 or more people in Israel according to the cited source, or an Israeli HQ whose main R&D is in Israel (JFrog, Fiverr, Taboola).
- `present`: an Israeli site that hires engineers, smaller than that. This includes acquired startups that still run as an Israeli R&D team (Okta, Zscaler, Workday) and customer-facing engineering offices (MongoDB).
- `none`: no Israeli engineering hiring found. Sales-only offices, investment arms, network data centers and closed R&D centers count as none. A `source` on a `none` entry documents the closure or the sales-only office.
- `unverified: true` (only on `none`): the company was not individually checked, or a targeted check was inconclusive. Read it as "unknown, default none".
- `rankIL`: order inside `major` by Israeli headcount from the cited source. Headcounts come from different dates (2020 to 2026) and some include non-engineers, so neighbours within about 20% can swap. Intel is ranked below Nvidia because about 4,000 of its 9,335 Israeli staff work at the Kiryat Gat fab, not in engineering.

## Method

- Company names are the exact strings in `src/js/data/problem-meta.json` and `src/js/data/company-sets.json` (273 names, the union of both).
- Re-checked every `major` and `present` entry from the first pass and every tier 1-2 company that was `none` + `unverified`, plus tier-3 entries with a plausible Israeli site (Rakuten, LG, Nike, Nielsen, UiPath, Netskope, Capgemini, Infosys, Yandex).
- Evidence order: Israeli tech press with headcounts (Globes, Calcalist/CTech, Ynet, Times of Israel), the company's own Israel careers or R&D page, then a dated Israel-located engineering job post. The Wikipedia list of multinational R&D centers and DUNS 100 rankings were dropped as sources: they confirm a past presence, not size or current hiring.
- Web search and fetch only; no LinkedIn employee counts were used.

## Major list (rank order)

| rankIL | Company | Israeli headcount in the source | Source |
|---|---|---|---|
| 1 | Nvidia | over 6,000 in five R&D centers (Jul 2026) | https://en.globes.co.il/en/article-1001548177 |
| 2 | Intel | 9,335 total, about 4,000 of them at the Kiryat Gat fab | https://www.intel.com/content/www/us/en/corporate-responsibility/intel-in-israel.html |
| 3 | Amdocs | about 5,000 at Israeli development centers (May 2026, before cuts of 300-400) | https://www.calcalistech.com/ctechnews/article/u4qmp07cv |
| 4 | Microsoft | about 3,000 (May 2025) | https://www.calcalistech.com/ctechnews/article/b1viij11zle |
| 5 | Mobileye | over 3,000 of about 4,000 | https://www.timesofisrael.com/struggling-mobileye-to-lay-off-hundreds-of-workers-mostly-in-israel/ |
| 6 | Check Point | over 3,000, about 2,000 in R&D (2025) | https://www.ynetnews.com/business/article/sy70id00bxl |
| 7 | Wix | about 3,000 (early 2026, before a 20% global cut) | https://en.globes.co.il/en/article-1001531388 |
| 8 | Palo Alto Networks | about 1,600 before buying CyberArk (closed Feb 2026) | https://www.timesofisrael.com/in-second-biggest-exit-in-israeli-history-palo-alto-buys-cyberark-for-25-billion/ |
| 9 | Apple | about 2,000 | https://www.timesofisrael.com/apple-to-open-new-development-center-in-jerusalem |
| 10 | Google | about 2,000 in R&D, excluding Wiz | https://en.globes.co.il/en/article-Google-Israel-RD-head-Yossi-Matias-moving-to-global-role-1001477138 |
| 11 | IBM | about 2,000 in five sites (2020 figure) | https://www.timesofisrael.com/ibm-to-fire-dozens-at-tel-aviv-rd-center/ |
| 12 | monday.com | 1,940 (2025, company report), about 350 Israeli cuts in Jul 2026 | https://monday.com/l/wp-content/uploads/2026/05/Equal-Pay-Public-Report-Eng.pdf |
| 13 | Amazon | about 1,300 in development (2020 figure, the latest found) | https://calcalistech.com/ctech/articles/0,7340,L-3851049,00.html |
| 14 | Wiz | about 1,000 of 1,800 (Google closed the deal Mar 2026) | https://www.jns.org/israel-news/google-closes-record-32-billion-deal-for-israeli-cybersecurity-firm-wiz |
| 15 | Salesforce | about 1,000 (Nov 2026) | https://www.calcalistech.com/ctechnews/article/ryjjvov6fx |
| 16 | Dell | about 1,000, mostly ex-EMC, before 2025 cuts | https://www.ynetnews.com/article/mkxuo1oz7 |
| 17 | Meta | about 1,000, minus about 100 laid off | https://en.globes.co.il/en/article-1001540895 |
| 18 | CyberArk | about 1,000, about 10% cut after the Palo Alto deal | https://en.globes.co.il/en/article-1001535229 |
| 19 | Qualcomm | about 700 (2023) plus about 190 from Autotalks and Alphawave | https://calcalistech.com/ctechnews/article/rytzpacjs |
| 20 | SAP | about 800 | https://www.calcalistech.com/ctechnews/article/rklvysfdzl |
| 21 | Cisco | about 800 | https://www.calcalistech.com/ctechnews/article/h1cjws5xwx |
| 22 | Akamai | about 700 | https://www.calcalistech.com/ctechnews/article/byh1bufb11l |
| 23 | Taboola | about 700 (Apr 2026) | https://en.globes.co.il/en/article-1001540177 |
| 24 | Intuit | 500+, its 2nd largest R&D center outside the US | https://intuit.com/careers/locations/israel |
| 25 | CrowdStrike | north of 500 (Nov 2026) | https://www.calcalistech.com/ctechnews/article/hyvm00ez0gl |
| 26 | Samsung | about 480 at SIRC alone (Feb 2024, incl. students and contractors) | https://semiconductor.samsung.com/sirc/ |
| 27 | Fiverr | 637 at end of 2024, then a 30% cut (Israeli HQ) | https://en.globes.co.il/en/article-1001521884 |
| - | JFrog | 400 in 2021, no newer count; co-HQ in Netanya | https://en.globes.co.il/en/article-1001366230 |
| - | ServiceNow | Armis (about 950 staff, much of it in Israel) closed Apr 2026 | https://www.ynetnews.com/business/article/r1z11dpnpwx |

## Changes from the first pass

Counts: before 27 major, 35 present, 211 none (111 unverified). After 29 major, 37 present, 207 none (57 unverified).

Upgrades:

- CrowdStrike: present -> major. Over 500 employees in Israel (Calcalist, Nov 2026).
- Dell: present -> major. About 1,000 in Israel, mostly ex-EMC R&D (Ynet).
- Intuit: present -> major. 500+ engineers, 2nd largest R&D center outside the US (Intuit careers).
- ServiceNow: none -> major. Bought Armis for $7.75B (closed Apr 2026), Armis R&D is in Tel Aviv.
- Bloomberg: none -> present. Tel Aviv is a regional engineering office, 2026 software engineer posting.
- Cadence: none -> present. About 300 in Israel, R&D in Haifa and Petah Tikva.
- Coinbase: none -> present. Israel R&D center built on Unbound Security (2021).
- Docusign: none -> present. Engineering team in Giv'at Shmuel, 2026 postings.
- Huawei: none -> present. Toga Networks R&D center, about 400 people.
- Walmart Labs: none -> present. Walmart Global Tech Israel (Aspectiva, Zeekit) in Tel Aviv.
- Workday: none -> present. HiredScore R&D center in Tel Aviv (150 people at acquisition).
- Rakuten: none -> present. Viber R&D in Ramat Gan / Bnei Brak.
- UiPath: none -> present. Small R&D center in Ra'anana since 2019.

Downgrades:

- PayPal: major -> present. About 300 in Israel, 70 laid off in 2026.
- Rubrik: major -> present. Israel site is the Laminar acquisition; no evidence of hundreds.
- Dropbox: present -> none. Closed its Israeli R&D center in 2023.
- eBay: present -> none. Closed the Netanya R&D center (by Q1 2026).
- Snowflake: present -> none. Only sales and solution-engineering roles in Tel Aviv.
- Visa: present -> none. The Tel Aviv site is a startup innovation studio, no engineering roles found.
- Barclays: present -> none. Only a 2018 mention of an Israel lab, no current Israel roles.
- Capgemini: present -> none. No Israeli engineering presence found.

`none` + `unverified` -> `none` (checked):

- Closed Israeli R&D: Adobe (2019), LinkedIn (Oribi center), Remitly (Feb 2026), Verily.
- Sales, banking or business offices only: Uber, Cloudflare, Stripe, OpenAI, Goldman Sachs, Morgan Stanley, TikTok, ByteDance, Databricks, Splunk, Nutanix.
- Investment arm only: SIG (Susquehanna Growth Equity, Ra'anana).
- No Israeli engineering presence found in a targeted search: Zoom, Twilio, Wells Fargo, Atlassian, Airbnb, Reddit, Pure Storage, Arista Networks, Asana, Confluent, Grammarly, Harness, Rippling, Wise, Revolut, Robinhood, SoFi, Plaid, Pinterest, Netflix, Spotify, Expedia, Instacart, Box, Applied Intuition, Anduril, Waymo, Nuro, Jane Street, Citadel.

Other notes:

- Every remaining `major` and `present` entry now has a primary or press source instead of the Wikipedia list or DUNS 100 (Okta, MongoDB, Zscaler, AMD, NetApp, Datadog, Citi, Snap, Navan, Mastercard, GE Healthcare, General Motors, Texas Instruments, Nokia, Yahoo, Autodesk, Siemens, Yandex, Infosys, Taboola, Akamai, Palo Alto Networks and the rest).
- Tier-3 `none` entries confirmed: Nike closed its Israeli R&D in 2023, Nielsen is winding down its Herzliya R&D (2026), Netskope has only a data center in Tel Aviv, LG's Israeli engineers sit in its Cybellum subsidiary rather than an LG site.

## Still uncertain

- Tesla (`none`, unverified): opened an R&D representative office in 2020, later news is about service roles and a hiring freeze.
- Hubspot (`none`, unverified): bought the Israeli startup XFunnel (Nov 2025); no source says the team keeps hiring in Israel.
- Amazon, IBM and JFrog headcounts are old (2020, 2020, 2021). Their real rank is probably higher.
- Wix, monday.com, Amdocs and Meta cut Israeli staff in 2026 after the cited figure; their ranks may drop a place or two.
- Weak `present` evidence: AMD (a 2011 Tel Aviv R&D center plus 2026 job-board listings in Haifa and Herzliya), Yahoo (2022 expansion, no newer news), Yandex (about 116 people in 2024, ownership changed since), UiPath (small, 2019 source), Coinbase (no news on the Israeli center after 2021), MongoDB (customer-facing engineers only), NetApp (sold Spot in 2025, still posting Tel Aviv R&D roles).
- Accenture, Deloitte and EPAM are left `none`: consulting offices with unclear software-engineering hiring.
- The remaining 57 `unverified` entries were not individually checked. Most are US or Asian companies with no known Israeli site (quant firms, Indian consumer apps, US consumer apps).

## How to update

1. Add or change the entry in `content/israel-hiring.json` (keep names identical to the metadata).
2. Give every `major` or `present` entry a `source` URL. If you cannot find one, use `none` with `"unverified": true`.
3. Run `node --test tests/israel-hiring.test.js`. It fails when a metadata company has no entry, a value is outside the allowed sets, or a major/present entry has no source.
4. Update the date at the top of this file and the `checked` field in the JSON.

After `scripts/content/build-meta.mjs` adds new companies, the test lists the missing names.
