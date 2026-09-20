/* Config loader.
   Source of truth: config/contracts.json.
   Over http(s) the JSON is fetched directly, so a deploy only needs the JSON edited.
   Opened from disk (file://) browsers block fetch, so the generated mirror
   config/contracts.js (window.RELL_CONFIG) is used instead. */
(function (RELL) {
  "use strict";

  var DEFAULTS = {
    network: { name: "Robinhood Chain", chainId: "", explorerUrl: "", rpcUrl: "" },
    token: { symbol: "RELL", address: "", launched: false },
    contracts: { rightsRegistry: "", verificationOracle: "", rightsRegistryDeploymentBlock: 0 },
    profile: { ipfsGateway: "https://ipfs.io/ipfs/" },
    walletConnect: { projectId: "" }
  };

  function merge(base, extra) {
    var out = {};
    Object.keys(base).forEach(function (key) {
      var b = base[key];
      var e = extra && Object.prototype.hasOwnProperty.call(extra, key) ? extra[key] : undefined;
      if (b && typeof b === "object" && !Array.isArray(b)) {
        out[key] = merge(b, e && typeof e === "object" ? e : {});
      } else {
        out[key] = e === undefined || e === null ? b : e;
      }
    });
    return out;
  }

  function fromMirror() {
    return merge(DEFAULTS, window.RELL_CONFIG || {});
  }

  RELL.getPath = function (obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  };

  RELL.loadConfig = function () {
    var isHttp = /^https?:$/.test(window.location.protocol);
    if (!isHttp || typeof fetch !== "function") {
      return Promise.resolve(fromMirror());
    }
    return fetch("config/contracts.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("config " + res.status);
        return res.json();
      })
      .then(function (json) {
        return merge(DEFAULTS, json);
      })
      .catch(function () {
        return fromMirror();
      });
  };
})(window.RELL = window.RELL || {});
