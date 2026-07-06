#!/usr/bin/env bash
# Assemble the opkg feed site into $1 for GitHub Pages.
#
# Both packages are Architecture: all, so there is ONE feed at the site root and
# no per-arch directories: opkg matches on the Packages.gz "Architecture: all"
# field, not on the feed URL, so a single feed serves every GL device.
#
# Requires: python3. Run tools/build_gui.sh first so gui/*_all.ipk are current.
set -euo pipefail

SITE="${1:?usage: assemble_site.sh <output-site-dir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/tools"

rm -rf "$SITE"; mkdir -p "$SITE"

# static root files
for f in index.html README.md setup.sh .nojekyll; do
  [ -e "$ROOT/$f" ] && cp "$ROOT/$f" "$SITE/"
done
cp "$ROOT"/*.png "$SITE/" 2>/dev/null || true

# the (arch-independent) ipks + index, at the root
cp "$ROOT"/gui/*_all.ipk "$SITE/"
python3 "$TOOLS/mkindex.py" "$SITE"

echo "== assembled feed =="
ls "$SITE"/*.ipk "$SITE"/Packages*
