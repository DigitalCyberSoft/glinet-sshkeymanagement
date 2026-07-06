#!/bin/sh
# Add the glinet-sshkeymanagement opkg feed for this router's architecture and
# install the SSH key manager (backend + panel). The feed is unsigned and GL opkg
# has check_signature on, so --force-signature is required on update AND install.
#
#   sh setup.sh --dry-run   # detect arch + print what would happen, change nothing
#   sh setup.sh             # add feed and install
set -e

BASE="https://digitalcybersoft.github.io/glinet-sshkeymanagement"
FEED_NAME="glsshkeys"
FEEDS="/etc/opkg/customfeeds.conf"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

# The device arch is the highest-priority entry from opkg that is not all/noarch
# and that this feed actually ships.
ARCH=""
for a in $(opkg print-architecture 2>/dev/null | awk '{print $2}'); do
  case "$a" in
    mips_24kc|mipsel_24kc|arm_cortex-a7|arm_cortex-a7_neon-vfpv4|arm_cortex-a15_neon-vfpv4|arm_cortex-a9_vfpv3-d16|aarch64_cortex-a53)
      ARCH="$a" ;;
  esac
done
[ -n "$ARCH" ] || { echo "could not determine a supported architecture from 'opkg print-architecture'" >&2; exit 1; }

LINE="src/gz $FEED_NAME $BASE/$ARCH"
echo "architecture : $ARCH"
echo "feed line    : $LINE"

if [ "$DRY" = 1 ]; then
  echo "(dry run) would ensure the line above is in $FEEDS, then:"
  echo "  opkg update --force-signature"
  echo "  opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview"
  exit 0
fi

touch "$FEEDS"
# Replace any existing line for this feed, then append the current one.
sed -i "/ $FEED_NAME /d" "$FEEDS"
echo "$LINE" >> "$FEEDS"

opkg update --force-signature
opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview

echo "done. Open the router panel: System -> SSH Keys."
