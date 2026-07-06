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

    // Compiled GL views ship their scoped CSS as style-loader modules; this is
    // the hand-rolled equivalent, injected once. Colours come from the panel's
    // theme variables (same ones the tailscale view's CSS uses).
    if (!document.getElementById("sshkeysview-style")) {
      var style = document.createElement("style");
      style.id = "sshkeysview-style";
      style.textContent =
        ".sshkeys-wrapper{padding:20px 0}" +
        ".sshkeys-wrapper .main{max-width:635px}" +
        ".sshkeys-wrapper .desc{display:flex;align-items:center;font-size:14px;padding:14px 15px;background-color:var(--info-background);color:var(--info);border-radius:5px}" +
        ".sshkeys-wrapper .desc .iconfont{font-size:14px;margin-right:14px}" +
        ".sshkeys-wrapper .desc p{line-height:1.5}" +
        ".sshkeys-wrapper .sshkeys-label{display:block;font-size:14px;color:var(--text-weak);margin:16px 0 6px}" +
        ".sshkeys-wrapper .sshkeys-actions{display:flex;justify-content:flex-end;margin-top:16px}" +
        ".sshkeys-wrapper .sshkeys-actions .btn-item{min-width:124px;height:36px}" +
        ".sshkeys-wrapper .sshkeys-list{margin-top:20px;border-top:1px solid var(--divider)}" +
        ".sshkeys-wrapper .sshkeys-row{display:flex;align-items:center;padding:14px 15px;border-bottom:1px solid var(--divider);font-size:14px}" +
        ".sshkeys-wrapper .sshkeys-info{flex:1;min-width:0;margin-right:10px}" +
        ".sshkeys-wrapper .sshkeys-kname{display:block;color:var(--text-regular)}" +
        ".sshkeys-wrapper .sshkeys-kmeta{display:block;color:var(--text-weak);font-size:12px;word-break:break-all}" +
        ".sshkeys-wrapper .sshkeys-row-btns{display:flex;align-items:center;gap:8px;margin-left:10px}" +
        ".sshkeys-wrapper .sshkeys-empty{padding:14px 15px;color:var(--text-weak);font-size:14px}";
      document.head.appendChild(style);
    }

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
          loading: !1,
          confirmId: ""
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
            var added = (r && r.added) || 1;
            t.$message.success(added > 1 ? t.$t("sshkeys.added_n", { n: added }) : t.$t("sshkeys.added"));
            if (r && r.skipped) t.$message.warning(t.$t("sshkeys.skipped_n", { n: r.skipped }));
            t.form.name = "", t.form.key = "";
            t.load()
          }, function() {
            t.loading = !1
          })
        },
        // Two-step remove: first click arms the row (button pair becomes
        // confirm/cancel), second click deletes. No dialog dependency.
        remove: function(k) {
          var t = this;
          if (t.confirmId !== k.id) {
            t.confirmId = k.id;
            return
          }
          t.confirmId = "";
          call("remove", { id: k.id }).then(function(r) {
            if (r && r.error) {
              // stale id (list changed underneath us) or backend refusal: say
              // so and re-sync rather than failing silently
              t.$message.error(r.error === "not found" ? t.$t("sshkeys.err_stale") : r.error);
              t.load();
              return
            }
            t.$message.success(t.$t("sshkeys.removed"));
            t.load()
          })
        },
        toggle: function(k, v) {
          var t = this;
          call("set_enabled", { id: k.id, enabled: !!v }).then(function(r) {
            if (r && r.error) {
              t.$message.error(r.error === "not found" ? t.$t("sshkeys.err_stale") : r.error);
              t.load()
            }
          })
        }
      },
      render: function(h) {
        var t = this;
        return h("div", { staticClass: "sshkeys-wrapper" }, [
          h("gl-title", { attrs: { title: t.$t("sshkeys.title") } }),
          h("div", { staticClass: "main" }, [
            h("gl-card", [
              h("div", { staticClass: "desc" }, [
                h("span", { staticClass: "iconfont icon-info" }),
                h("p", [t.$t("sshkeys.desc")])
              ]),
              h("label", { staticClass: "sshkeys-label" }, [t.$t("sshkeys.key_label")]),
              h("el-input", {
                attrs: {
                  type: "textarea",
                  rows: 4,
                  placeholder: t.$t("sshkeys.key_ph")
                },
                model: {
                  value: t.form.key,
                  callback: function(v) { t.form.key = v }
                }
              }),
              h("label", { staticClass: "sshkeys-label" }, [t.$t("sshkeys.name_label")]),
              h("el-input", {
                attrs: { placeholder: t.$t("sshkeys.name_ph") },
                model: {
                  value: t.form.name,
                  callback: function(v) { t.form.name = v }
                }
              }),
              h("div", { staticClass: "sshkeys-actions" }, [
                h("gl-button", {
                  staticClass: "btn-item",
                  attrs: { type: "primary", disabled: t.loading },
                  on: { click: t.add }
                }, [t.$t("sshkeys.add_btn")])
              ]),
              h("div", { staticClass: "sshkeys-list" }, t.keys.length ? t.keys.map(function(k) {
                return h("div", { staticClass: "sshkeys-row", key: k.id }, [
                  h("div", { staticClass: "sshkeys-info" }, [
                    h("span", { staticClass: "sshkeys-kname" }, [k.name || k.comment || k.type]),
                    h("span", { staticClass: "sshkeys-kmeta" }, [k.type + " …" + k.tail])
                  ]),
                  h("gl-switch", {
                    attrs: { size: "small" },
                    model: {
                      value: k.enabled,
                      callback: function(v) { t.toggle(k, v) }
                    }
                  }),
                  h("div", { staticClass: "sshkeys-row-btns" }, t.confirmId === k.id ? [
                    h("gl-button", {
                      attrs: { type: "abort" },
                      on: { click: function() { t.remove(k) } }
                    }, [t.$t("sshkeys.remove_btn")]),
                    h("gl-button", {
                      on: { click: function() { t.confirmId = "" } }
                    }, [t.$t("core.cancel")])
                  ] : [
                    h("gl-button", {
                      on: { click: function() { t.remove(k) } }
                    }, [t.$t("sshkeys.remove_btn")])
                  ])
                ])
              }) : [h("p", { staticClass: "sshkeys-empty" }, [t.$t("sshkeys.empty")])])
            ])
          ])
        ])
      }
    };

    e.default = component
  }
}).default;
