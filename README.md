# glinet-sshkeymanagement

A GL.iNet router panel for managing the SSH public keys authorised to log in as
root, designed to survive reboots **and firmware upgrades**.

Two opkg packages, `Architecture: all`:

| Package | Role |
| --- | --- |
| `gl-sdk4-sshkeys` | Backend: rpc handler, uci key store, boot-time renderer |
| `gl-sdk4-ui-sshkeysview` | Frontend: the GL oui-httpd panel view |

## Design

### Source of truth: uci, not authorized_keys

Keys live in `/etc/config/sshkeys` as `config key` sections (name, type, base64
blob, comment, enabled). `authorized_keys` is a *rendered artifact*, never the
store. This lets the panel add/remove/toggle keys transactionally and keeps GL's
own cloud-management keys untouched.

### Rendering: a managed block

`/usr/bin/gl_sshkeys render` rewrites only the region between

```
# --- gl-sdk4-sshkeys managed block: do not edit between markers ---
...our keys...
# --- end gl-sdk4-sshkeys managed block ---
```

in `/etc/dropbear/authorized_keys`. Everything outside the markers is preserved
verbatim, so GL's cloud key and any hand-added keys are never clobbered. The
rewrite is idempotent.

### Surviving firmware upgrades

A GL sysupgrade wipes `/overlay`, so an opkg-installed package cannot be assumed
to persist. Two independent mechanisms guarantee you are never locked out:

1. **`lib/upgrade/keep.d/*`** lists the files sysupgrade must carry across the
   flash: the uci store, the rendered `authorized_keys`, the rpc handler, the
   renderer, and the init script. sysupgrade reads keep.d *before* wiping the
   overlay, so these files land in the new rootfs.
2. **`/etc/init.d/sshkeys` (START=95)** re-renders `authorized_keys` from the
   preserved uci store on every boot. Even if new firmware ships a pristine
   `authorized_keys`, your keys are re-applied before you need them.

The panel bundle itself is also kept via keep.d (best-effort); if a firmware
release ever displaces it, reinstall the two packages from the feed. Your SSH
access does not depend on the panel surviving, only on the keys surviving.

### Security-key (FIDO / YubiKey) support

`sk-ssh-ed25519@openssh.com` and `sk-ecdsa-sha2-nistp256@openssh.com` are accepted.
dropbear supports these in `authorized_keys` since 2022.82 (OpenWrt 22.03.x /
current GL firmware). Note: the `no-touch-required` option requires dropbear
2022.83; v1 stores bare keys only (no options prefixes), so keys are touch-required.

## Build

```sh
tools/build_gui.sh          # -> gui/*_all.ipk (gzip-tar; the format GL's opkg extracts)
```

`gui-src/.../views/view.js` is the readable bundle source; the packer renames and
gzips it to `<pkg>.common.js.gz` (the exact path nginx `gzip_static` serves).

## Install (on-device)

```sh
opkg install ./gl-sdk4-sshkeys_1.0.0-1_all.ipk ./gl-sdk4-ui-sshkeysview_1.0.0-1_all.ipk
# or, once published to the feed:
opkg update --force-signature && opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview
```

Then open the router panel; the entry appears under **Applications → SSH Keys**.

## Publish (via the glinet-tailscale-feed)

These `_all.ipk` files are arch-independent. To serve them from the existing feed:
copy both into that repo's `gui/` and run its `build-feed.yml` workflow, which
re-runs `assemble_site.sh` (it globs `gui/*_all.ipk` into every arch).

## RPC surface (`object: sshkeys`)

| Method | Args | Returns |
| --- | --- | --- |
| `list` | – | `{ keys: [{id,name,type,comment,tail,enabled}] }` |
| `add` | `{name,key}` | `{ok:true,id}` or `{error}` |
| `remove` | `{id}` | `{ok:true}` or `{error}` |
| `set_enabled` | `{id,enabled}` | `{ok:true}` or `{error}` |

`add` validates the key type (rejects anything dropbear cannot verify), requires
base64 key data, and rejects options-prefixed lines and duplicates.

## Status

v1. Backend logic (parser, managed-block renderer) is unit-tested off-device. The
panel bundle is hand-authored to GL's webpack-UMD contract and must be verified on
real hardware: confirm the SPA routes the new `sshkeysview` (GL panels are loaded
data-driven from `menu.d`, but a brand-new view name should be smoke-tested first).
