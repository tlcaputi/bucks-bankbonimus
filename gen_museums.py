#!/usr/bin/env python3
"""Generate one Jekyll page per museum in _museums/ from _data/museums.yml.

museums.yml stays the single editable source of truth; run this after editing it
to (re)generate the per-museum collection pages, then commit both.

    python3 gen_museums.py
"""
import os
import sys
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "_data", "museums.yml")
OUT = os.path.join(HERE, "_museums")

# front-matter keys copied straight through (everything except the free-text
# blurb, which becomes the page body).
FM_KEYS = ["id", "name", "region", "category", "town", "address", "lat", "lng",
           "website", "phone", "admission", "hours", "drive_min", "seasonal",
           "appointment_only", "featured", "source"]


def main():
    with open(SRC) as f:
        museums = yaml.safe_load(f)
    if not isinstance(museums, list):
        sys.exit("museums.yml did not parse to a list")

    os.makedirs(OUT, exist_ok=True)
    # clear stale generated pages
    for fn in os.listdir(OUT):
        if fn.endswith(".md"):
            os.remove(os.path.join(OUT, fn))

    seen = set()
    for m in museums:
        mid = m.get("id")
        if not mid:
            sys.exit(f"museum missing id: {m.get('name')!r}")
        if mid in seen:
            sys.exit(f"duplicate museum id: {mid}")
        seen.add(mid)

        fm = {"layout": "museum"}
        for k in FM_KEYS:
            if k in m:
                fm[k] = m[k]
        fm.setdefault("seasonal", False)
        fm.setdefault("appointment_only", False)
        fm.setdefault("featured", False)

        body = (m.get("blurb") or "").strip()
        front = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, default_flow_style=False)
        path = os.path.join(OUT, f"{mid}.md")
        with open(path, "w") as f:
            f.write("---\n")
            f.write(front)
            f.write("---\n")
            if body:
                f.write(body + "\n")

    print(f"generated {len(museums)} museum pages in _museums/")


if __name__ == "__main__":
    main()
