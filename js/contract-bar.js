/* Contract address bar.
   Reads token.launched and token.address from config/contracts.json.
     launched false  shows Coming soon, whatever the address field holds
     launched true   shows the address, and copy writes the real value
   The same value is mirrored into the scope section. */
(function (RELL) {
  "use strict";

  var FEEDBACK_MS = 1800;
  var ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
  var COMPACT_MQ = "(max-width: 767px)";

  function shorten(address) {
    return address.slice(0, 6) + "…" + address.slice(-4);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(area);
      if (ok) {
        resolve();
      } else {
        reject(new Error("copy failed"));
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  RELL.initContractBar = function (config) {
    var bar = document.querySelector("[data-ca-bar]");
    if (!bar) return;

    var text = bar.querySelector("[data-ca-text]");
    var button = bar.querySelector("[data-ca-copy]");
    var label = bar.querySelector("[data-ca-copy-text]");
    var explorer = bar.querySelector("[data-ca-explorer]");
    var mirror = document.querySelector("[data-ca-mirror]");

    var token = (config && config.token) || {};
    var address = String(token.address || "").trim();
    var live = token.launched === true && address.length > 0;
    var compact = window.matchMedia(COMPACT_MQ);
    var timer = null;

    if (token.launched === true && !address && window.console) {
      console.warn("RELL: token.launched is true but token.address is empty. Showing Coming soon.");
    }
    if (address && !ADDRESS_RE.test(address) && window.console) {
      console.warn("RELL: token.address does not look like an EVM address:", address);
    }

    function render() {
      bar.setAttribute("data-state", live ? "live" : "soon");
      if (live) {
        text.textContent = compact.matches ? shorten(address) : address;
        text.title = address;
        button.setAttribute("aria-label", "Copy the contract address " + address);
      } else {
        text.textContent = "Coming soon";
        text.removeAttribute("title");
        button.setAttribute("aria-label", "Copy the contract address. Available at launch.");
      }
      if (mirror) mirror.textContent = live ? address : "Coming soon";

      var base = String((config.network && config.network.explorerUrl) || "").replace(/\/+$/, "");
      if (live && base) {
        explorer.href = base + "/address/" + address;
        explorer.hidden = false;
      } else {
        explorer.hidden = true;
      }
    }

    function setState(state, message) {
      button.setAttribute("data-copy-state", state);
      label.textContent = message;
      window.clearTimeout(timer);
      if (state !== "idle") {
        timer = window.setTimeout(function () {
          setState("idle", "Copy");
        }, FEEDBACK_MS);
      }
    }

    button.addEventListener("click", function () {
      if (!live) {
        RELL.toast("The address appears here at launch.");
        return;
      }
      copyText(address).then(
        function () {
          setState("copied", "Copied");
          RELL.toast("Contract address copied.");
        },
        function () {
          setState("idle", "Copy");
          RELL.toast("Copy was blocked. Select the address instead.");
        }
      );
    });

    render();
    if (compact.addEventListener) compact.addEventListener("change", render);
  };
})(window.RELL = window.RELL || {});
