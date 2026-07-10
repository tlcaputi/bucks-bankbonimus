# bucks.bankbonimus.com

A personal, no-login guide to **museums, historic houses, and visitor centers within about a
45-minute drive of New Hope, PA** — across Bucks County, Hunterdon County (NJ), Doylestown,
Lambertville, Newtown/Lower Bucks, and the Princeton/Trenton edge. Built to *see everything at
once* with current **hours**, **admission**, links, and a map so we can plan a day out.

Only places with a real **museum, historic-house museum, visitor center, or historic-site
component** are included — pure parks are excluded unless they have such a component.

## How it's built

- **Jekyll + GitHub Pages**, reusing the shared Bankbonimus theme (`assets/css/custom.css`,
  fonts, favicon). Site-specific styles live in `assets/css/bucks.css` (a heritage
  green/brick/brass palette). Standalone — no shared bankbonimus nav header.
- **All museums live in one data file:** [`_data/museums.yml`](_data/museums.yml). Each museum
  has a `region` (`new-hope` | `lambertville` | `doylestown` | `lower-bucks` | `princeton`),
  a `category`, `town`, `address`, `lat`/`lng`, `hours`, `admission`, `website`, `phone`,
  `drive_min`, `seasonal`/`appointment_only` flags, a `blurb`, and a **`source`** URL.
- **`index.html`** renders museums grouped **by region** as cards (server-side, SEO- and
  no-JS-friendly) and embeds the data as JSON for the map.
- **`assets/js/map.js`** builds the **overview map** (Leaflet + CARTO tiles) and wires the
  filter bar (area / type / free-only / search) to both the map pins and the on-page cards.
- **`_layouts/museum.html`** renders each per-museum detail page (hours, admission, phone,
  directions, mini-map, "more in this area").

## Data integrity

Every museum is backed by a real `source:` URL that a research pass actually fetched. Hours and
admission are **not invented** — where a value could not be confirmed it is set to
`"UNKNOWN — confirm"` rather than guessed, and seasonal/appointment-only sites are flagged.
**Confirm hours on the museum's own website before you go** — small historic-house museums in
particular change seasonal hours often.

The starting point is treated as **downtown New Hope, PA** — no private street address is
stored anywhere in this repo. `drive_min` values are rough estimates from downtown New Hope.

## Editing

`_data/museums.yml` is the **single source of truth**. After editing it, regenerate the
per-museum collection and commit both:

```bash
python3 gen_museums.py            # _data/museums.yml -> _museums/<id>.md (one page per museum)
git add -A && git commit -m "..." && git push
```

Preview locally (rbenv Jekyll 4; the repo Gemfile targets GH Pages so move it aside):

```bash
mv Gemfile _Gemfile.bak
env -i PATH="$HOME/.rbenv/versions/3.1.2/bin:/usr/bin:/bin" HOME="$HOME" \
  jekyll build --destination /tmp/bucks-site && (cd /tmp/bucks-site && python3 -m http.server 8765)
mv _Gemfile.bak Gemfile
```

## Gotchas (read before touching templates/config)

- **No Liquid `sort`/`push` over collection docs** — GitHub Pages' Jekyll 3.10 crashes on them
  (builds fine on local Jekyll 4, FAILS on GH Pages). The collection is pre-sorted via
  `collections.museums.sort_by: name`. Always check the Actions build after pushing.
- The official external link is `website` on museum pages (`url` is the page's own URL).

## Deploy

**Live at https://bucks.bankbonimus.com** (deployed 2026-07-09). GitHub Pages builds from
`main`. Repo: `tlcaputi/bucks-bankbonimus` (public). Commit + push to deploy; confirm the
build with `gh api repos/tlcaputi/bucks-bankbonimus/pages/builds/latest -q '.status'`.

**DNS / HTTPS note:** the Cloudflare CNAME `bucks` → `tlcaputi.github.io` is **PROXIED
(orange cloud)**, *unlike* the DNS-only sibling sites. GitHub's Pages Let's-Encrypt cert
stalled at `authorization_created`, so the domain is proxied through Cloudflare for HTTPS
(zone SSL mode = `full`, GitHub "Enforce HTTPS" off → Cloudflare serves its own
`*.bankbonimus.com` cert, no redirect loop). To revert to the DNS-only pattern once GitHub's
cert issues: set the record `proxied:false` and enable Enforce HTTPS in Pages settings.
Full history/handoff: `.CHANGELOG/CURRENT_STATE.md` (gitignored).
