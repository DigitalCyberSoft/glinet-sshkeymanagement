module.exports = function(t) {
  var e = {};

  function i(n) {
    if (e[n]) return e[n].exports;
    var a = e[n] = {
      i: n,
      l: !1,
      exports: {}
    };
    return t[n].call(a.exports, a, a.exports, i), a.l = !0, a.exports
  }
  return i.m = t, i.c = e, i.d = function(t, e, n) {
    i.o(t, e) || Object.defineProperty(t, e, {
      enumerable: !0,
      get: n
    })
  }, i.r = function(t) {
    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
      value: "Module"
    }), Object.defineProperty(t, "__esModule", {
      value: !0
    })
  }, i.o = function(t, e) {
    return Object.prototype.hasOwnProperty.call(t, e)
  }, i.p = "", i(i.s = "fb15")
}({
  fb15: function(t, e, i) {
    "use strict";
    i.r(e);

    // JSON-RPC transport exposed by the GL SPA: $request("call",[token,object,method,args]).
    // Token comes from the Admin-Token cookie, same pattern as every GL panel.
    var token = function() {
      return decodeURIComponent(((document.cookie.match(/(?:^|;\s*)Admin-Token=([^;]*)/) || [])[1] || ""))
    };
    var call = function(method, args) {
      return window.$request("call", [token(), "sshkeys", method, args || {}])
    };

    var component = {
      name: "sshkeysview",
      data: function() {
        return {
          keys: [],
          form: { name: "", key: "" },
          loading: !1
        }
      },
      created: function() {
        this.load()
      },
      methods: {
        load: function() {
          var t = this;
          call("list").then(function(r) {
            if (r && !r.err_msg) t.keys = (r && r.keys) || []
          })
        },
        add: function() {
          var t = this;
          if (!t.form.key || !t.form.key.trim()) {
            t.$message.error(t.$t("sshkeys.err_invalid"));
            return
          }
          t.loading = !0;
          call("add", { name: t.form.name, key: t.form.key }).then(function(r) {
            t.loading = !1;
            if (r && r.error) {
              t.$message.error(r.error === "duplicate key" ? t.$t("sshkeys.err_duplicate") : t.$t("sshkeys.err_invalid"));
              return
            }
            t.$message.success(t.$t("sshkeys.added"));
            t.form.name = "", t.form.key = "";
            t.load()
          }, function() {
            t.loading = !1
          })
        },
        remove: function(k) {
          var t = this;
          t.$confirm(t.$t("sshkeys.confirm_remove")).then(function() {
            call("remove", { id: k.id }).then(function(r) {
              if (!(r && r.error)) {
                t.$message.success(t.$t("sshkeys.removed"));
                t.load()
              }
            })
          }).catch(function() {})
        },
        toggle: function(k, v) {
          var t = this;
          call("set_enabled", { id: k.id, enabled: !!v }).then(function(r) {
            if (r && r.error) {
              t.$message.error(r.error);
              t.load()
            }
          })
        }
      },
      render: function(h) {
        var t = this;
        return h("div", { staticClass: "sshkeys-wrapper" }, [
          h("gl-title", { attrs: { title: t.$t("sshkeys.title") } }),
          h("gl-card", [
            h("div", { staticClass: "desc" }, [
              h("span", { staticClass: "iconfont icon-info" }),
              h("p", [t.$t("sshkeys.desc")])
            ]),
            h("div", { staticClass: "sshkeys-add" }, [
              h("el-input", {
                staticClass: "sshkeys-name",
                props: { value: t.form.name, placeholder: t.$t("sshkeys.name_ph") },
                on: { input: function(v) { t.form.name = v } }
              }),
              h("el-input", {
                staticClass: "sshkeys-key",
                props: { value: t.form.key, type: "textarea", rows: 3, placeholder: t.$t("sshkeys.key_ph") },
                on: { input: function(v) { t.form.key = v } }
              }),
              h("el-button", {
                props: { type: "primary", loading: t.loading },
                on: { click: t.add }
              }, [t.$t("sshkeys.add_btn")])
            ]),
            h("div", { staticClass: "sshkeys-list" }, t.keys.length ? t.keys.map(function(k) {
              return h("div", { staticClass: "sshkeys-row", key: k.id }, [
                h("div", { staticClass: "sshkeys-info" }, [
                  h("span", { staticClass: "sshkeys-kname" }, [k.name || k.comment || k.type]),
                  h("span", { staticClass: "sshkeys-kmeta" }, [" " + k.type + "  …" + k.tail])
                ]),
                h("el-switch", {
                  props: { value: k.enabled },
                  on: { change: function(v) { t.toggle(k, v) } }
                }),
                h("el-button", {
                  props: { type: "text" },
                  on: { click: function() { t.remove(k) } }
                }, [t.$t("sshkeys.remove_btn")])
              ])
            }) : [h("p", { staticClass: "sshkeys-empty" }, [t.$t("sshkeys.empty")])])
          ])
        ])
      }
    };

    e.default = component
  }
});
