#!/usr/bin/env bash
# Assemble the opkg feed site into $1 for GitHub Pages: static root files + one
# dir per GL architecture, each holding the two Architecture:all GUI ipks and a
# regenerated Packages/Packages.gz.
#
# Unlike the tailscale feed there is no arch-specific binary to fetch -- both
# packages are Architecture: all, so every arch dir gets the same two ipks.
#
# Requires: python3. Run tools/build_gui.sh first so gui/*_all.ipk are current.
set -euo pipefail

SITE="${1:?usage: assemble_site.sh <output-site-dir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/tools"
ARCHES="mips_24kc mipsel_24kc arm_cortex-a7 arm_cortex-a7_neon-vfpv4 arm_cortex-a15_neon-vfpv4 arm_cortex-a9_vfpv3-d16 aarch64_cortex-a53"

rm -rf "$SITE"; mkdir -p "$SITE"

# static root files
for f in index.html README.md setup.sh .nojekyll; do
  [ -e "$ROOT/$f" ] && cp "$ROOT/$f" "$SITE/"
done

# per-arch dirs, each seeded with the (arch-independent) GUI ipks
for a in $ARCHES; do
  mkdir -p "$SITE/$a"
  cp "$ROOT"/gui/*_all.ipk "$SITE/$a/"
done

python3 "$TOOLS/mkindex.py" $(for a in $ARCHES; do printf '%s ' "$SITE/$a"; done)

echo "== assembled site =="
find "$SITE" -maxdepth 2 -name '*.ipk' -printf '%P\n' | sort
