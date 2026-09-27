/* Site bar for the app and docs pages: the dark or light treatment of the
   floating bar, and the mobile sheet. The landing page has its own copy of this
   in js/landing.js, because its bar is the one from the template markup. */
(function (RELL) {
  "use strict";

  var PROBE = 50;

  function initScrollState() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var dark = Array.prototype.slice.call(document.querySelectorAll("[data-nav-dark]"));
    var queued = false;
    function update() {
      queued = false;
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      header.classList.toggle("is-dark", dark.some(function (el) {
        var r = el.getBoundingClientRect();
        return r.top <= PROBE && r.bottom >= PROBE;
      }));
    }
    function request() {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    }
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
  }

  function initSheet() {
    var sheet = document.querySelector("[data-sheet]");
    var opener = document.querySelector("[data-sheet-open]");
    if (!sheet || !opener) return;

    function open() {
      sheet.hidden = false;
      opener.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = sheet.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    }

    function close() {
      if (sheet.hidden) return;
      sheet.hidden = true;
      opener.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    opener.addEventListener("click", open);
    sheet.querySelectorAll("[data-sheet-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    sheet.addEventListener("click", function (event) {
      if (event.target === sheet) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !sheet.hidden) {
        close();
        opener.focus({ preventScroll: true });
      }
    });
    var desktop = window.matchMedia("(min-width: 1200px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function (mq) {
        if (mq.matches) close();
      });
    }
  }

  RELL.initHeader = function () {
    initScrollState();
    initSheet();
  };
})(window.RELL = window.RELL || {});
