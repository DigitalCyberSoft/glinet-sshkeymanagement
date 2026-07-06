# glinet-sshkeymanagement

Add and remove the SSH public keys that may log in to a GL.iNet router, from the
router's own admin panel. Keys survive reboots and firmware upgrades.

![SSH Keys panel](sshkeys-panel.png)

## Install

Feed URL (one feed, every device):

```
https://digitalcybersoft.github.io/glinet-sshkeymanagement
```

On the router, either run the installer:

```sh
curl -fsSL https://digitalcybersoft.github.io/glinet-sshkeymanagement/setup.sh -o /tmp/setup.sh
sh /tmp/setup.sh
```

...or add the feed manually:

```sh
echo 'src/gz glsshkeys https://digitalcybersoft.github.io/glinet-sshkeymanagement' >> /etc/opkg/customfeeds.conf
opkg update --force-signature
opkg install --force-signature gl-sdk4-sshkeys gl-sdk4-ui-sshkeysview
```

The feed is unsigned, so `--force-signature` is required on both commands. Then
open **System → SSH Keys** in the panel.

## What it does

- Paste a public key to authorise it; remove or disable it later.
- Accepts `ssh-ed25519`, `ssh-rsa`, `ecdsa`, and FIDO/YubiKey `sk-ssh-ed25519` /
  `sk-ecdsa` keys.
- Keys live in `/etc/config/sshkeys` and are rendered into dropbear's
  `authorized_keys` as a managed block, leaving GL's own keys untouched.
- An init script re-applies them on every boot, and `keep.d` preserves them
  across firmware upgrades, so you are never locked out by an update.

## Packages

Both `Architecture: all`, served from one feed for every device:

- `gl-sdk4-sshkeys` — backend (rpc + uci store + boot renderer)
- `gl-sdk4-ui-sshkeysview` — the admin-panel view

## Build

```sh
tools/build_gui.sh                       # -> gui/*_all.ipk
tools/assemble_site.sh _site             # -> the Pages feed
```

`pages.yml` does both and deploys on every push to `main`.

## Status

Verified on a GL.iNet router running firmware 4.9.0 (aarch64): the panel loads
under **System → SSH Keys**, adds single and multi-key (one per line) pastes,
accepts `ssh-*`, `ecdsa-*`, and `sk-*@openssh.com` types, toggles keys on/off,
removes them, and re-renders the managed `authorized_keys` block. Stored keys
survive a package upgrade (uci conffile) and a reboot (init re-render).
