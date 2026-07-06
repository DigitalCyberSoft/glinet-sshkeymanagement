-- Param whitelist for the "sshkeys" rpc object, consumed by
-- /usr/lib/lua/oui/rpc.lua (valid_rpc). Without this file every string param
-- falls back to the core's default pattern '^[%w%.%s%-_:#/]-$', which rejects
-- the '+' and '=' of base64 key data and the '@' in sk-*@openssh.com types, so
-- adds die with -32602 ("illegal parameter") before reaching the handler.
-- Patterns here only gate the transport; /usr/lib/oui-httpd/rpc/sshkeys still
-- parses and validates strictly.
return {
    list = true,
    add = {
        name = "^[%w%p ]-$",
        key = "^[%w%p%s]-$",
    },
    remove = {
        id = "^%w+$",
    },
    set_enabled = {
        id = "^%w+$",
    },
}
