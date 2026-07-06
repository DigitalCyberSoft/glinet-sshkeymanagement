#!/usr/bin/env bash
# Package the static GUI ipks from gui-src/ into gui/ as gzip-tar containers (the
# only .ipk format GL's opkg reliably extracts). Architecture: all.
#
# Per-package transform:
#   gl-sdk4-ui-sshkeysview ships its view as www/views/<pkg>.common.js.gz -- that is
#   the exact path GL's panel loads (nginx gzip_static serves it for the
#   uncompressed request). gui-src keeps the readable view.js for small diffs; this
#   script renames+gzips it at pack time. Shipping the raw view.js instead leaves
#   /views/<pkg>.common.js absent and the panel dies with a request timeout.
#
# Container: gzip( tar( ./debian-binary, ./data.tar.gz, ./control.tar.gz ) ).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/gui-src"
OUT="$ROOT/gui"
PKGS=(gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview)

TARFLAGS=(--numeric-owner --owner=0 --group=0 --mtime=@0 --format=gnu)

pack() { # $1 = package source dir name
  local name="$1" src="$SRC/$1"
  [ -d "$src" ] || { echo "skip $1 (no gui-src dir)"; return 0; }

  local ver arch filever
  ver="$(sed -n 's/^Version:[[:space:]]*//p' "$src/control")"
  arch="$(sed -n 's/^Architecture:[[:space:]]*//p' "$src/control")"
  filever="${ver#*:}"   # strip epoch for the filename (Debian convention)

  local work; work="$(mktemp -d)"
  trap 'rm -rf "$work"' RETURN
  mkdir -p "$work/data" "$work/ctrl"

  cp -a "$src/data/." "$work/data/"

  # view package: view.js -> <pkg>.common.js.gz (the panel's real entry point)
  if [ -f "$work/data/www/views/view.js" ]; then
    gzip -9 -n -c "$work/data/www/views/view.js" > "$work/data/www/views/${name}.common.js.gz"
    rm -f "$work/data/www/views/view.js"
  fi

  printf '2.0\n' > "$work/debian-binary"
  tar "${TARFLAGS[@]}" -C "$work/data" -czf "$work/data.tar.gz" ./

  cp "$src/control" "$work/ctrl/control"; chmod 644 "$work/ctrl/control"
  local members="./control" s
  for s in preinst postinst prerm postrm; do
    if [ -f "$src/$s" ]; then cp "$src/$s" "$work/ctrl/$s"; chmod 755 "$work/ctrl/$s"; members="$members ./$s"; fi
  done
  # conffiles marks /etc files opkg must not clobber on upgrade (stored keys!)
  if [ -f "$src/conffiles" ]; then cp "$src/conffiles" "$work/ctrl/conffiles"; chmod 644 "$work/ctrl/conffiles"; members="$members ./conffiles"; fi
  ( cd "$work/ctrl" && tar "${TARFLAGS[@]}" -czf "$work/control.tar.gz" $members )

  local ipk="$OUT/${name}_${filever}_${arch}.ipk"
  rm -f "$ipk"
  tar "${TARFLAGS[@]}" -C "$work" -czf "$ipk" ./debian-binary ./data.tar.gz ./control.tar.gz
  echo "built ${ipk#$ROOT/}  (Version: $ver)"
}

mkdir -p "$OUT"
for p in "${PKGS[@]}"; do pack "$p"; done
