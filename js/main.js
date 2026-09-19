/* Entry point. Loads the config, binds config driven text, starts components. */
(function (RELL) {
  "use strict";

  var toastRegion = null;

  RELL.toast = function (message) {
    toastRegion = toastRegion || document.querySelector("[data-toast-region]");
    if (!toastRegion) return;
    toastRegion.textContent = "";
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastRegion.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, 2200);
  };

  function bindConfigText(config) {
    document.querySelectorAll("[data-config-text]").forEach(function (el) {
      var value = RELL.getPath(config, el.getAttribute("data-config-text"));
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        el.textContent = String(value);
      }
    });

    var chainRow = document.querySelector("[data-chain-id]");
    if (chainRow) {
      chainRow.hidden = !(config.network && String(config.network.chainId || "").trim());
    }
  }

  function start() {
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    RELL.initHeader();
    RELL.initMarquee();
    RELL.initRightsDialog();
    RELL.initReveal();

    RELL.loadConfig().then(function (config) {
      RELL.config = config;
      bindConfigText(config);
      RELL.initContractBar(config);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window.RELL = window.RELL || {});
