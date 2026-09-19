/* Entry point. Starts the components, then binds everything the config drives. */
(function (RELL) {
  "use strict";

  var toastRegion = null;
  var toastTimer = null;

  RELL.toast = function (message) {
    toastRegion = toastRegion || document.querySelector("[data-toast-region]");
    if (!toastRegion) return;
    toastRegion.textContent = "";
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastRegion.appendChild(toast);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  };

  function bindConfigText(config) {
    document.querySelectorAll("[data-config-text]").forEach(function (el) {
      var value = RELL.getPath(config, el.getAttribute("data-config-text"));
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        el.textContent = String(value);
      }
    });
  }

  /* Contract addresses link out to the explorer once both the address and the
     explorer URL are configured. Until then the row stays plain text. */
  function bindContractLinks(config) {
    var base = String((config.network && config.network.explorerUrl) || "").replace(/\/+$/, "");
    document.querySelectorAll("[data-contract-link]").forEach(function (link) {
      var address = RELL.getPath(config, link.getAttribute("data-contract-link"));
      var icon = link.parentNode ? link.parentNode.querySelector("svg") : null;
      if (!base || !address) {
        link.removeAttribute("href");
        link.removeAttribute("target");
        link.removeAttribute("rel");
        if (icon) icon.style.display = "none";
        return;
      }
      link.href = base + "/address/" + address;
      link.setAttribute("aria-label", "View this contract on the explorer");
    });
  }

  function start() {
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    RELL.initHeader();
    RELL.initExplorer();
    RELL.initFaq();
    RELL.initReveal();

    RELL.loadConfig().then(function (config) {
      RELL.config = config;
      bindConfigText(config);
      bindContractLinks(config);
      RELL.initContractBar(config);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window.RELL = window.RELL || {});
