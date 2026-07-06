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

opkg update --force-signature
opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview

echo "done. Open the router panel: System -> SSH Keys."
