#!/bin/sh
# Add the glinet-sshkeymanagement opkg feed and install the SSH key manager.
# Both packages are Architecture: all, so one feed serves every GL device -- no
# arch detection needed. The feed is unsigned and GL opkg has check_signature on,
# so --force-signature is required on update AND install.
#
#   sh setup.sh --dry-run   # print what would happen, change nothing
#   sh setup.sh             # add feed + install
set -e

BASE="https://digitalcybersoft.github.io/glinet-sshkeymanagement"
FEED="glsshkeys"
FEEDS="/etc/opkg/customfeeds.conf"

if [ "${1:-}" = "--dry-run" ]; then
  echo "would add: src/gz $FEED $BASE"
  echo "then:      opkg update --force-signature"
  echo "           opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview"
  exit 0
fi

touch "$FEEDS"
sed -i "/ $FEED /d" "$FEEDS"
echo "src/gz $FEED $BASE" >> "$FEEDS"

# A forced update still exits non-zero whenever ANY configured feed is unsigned
# (each missing Packages.sig counts as an error, and ours always is), so under
# set -e the bare call aborted before the install. Its exit code says nothing
# about our feed: check that our package list landed instead. `opkg info` can't
# tell -- GL's opkg exits 0 even for a package no list carries.
opkg update --force-signature || true
LISTS_DIR=$(awk '$1=="lists_dir" {print $NF}' /etc/opkg.conf 2>/dev/null) || LISTS_DIR=""
if [ ! -s "${LISTS_DIR:-/var/opkg-lists}/$FEED" ]; then
  echo "ERROR: $FEED package list missing after opkg update; check the router's network/DNS and that $BASE/Packages is reachable." >&2
  exit 1
fi
opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview

echo "done. Open the router panel: System -> SSH Keys."
