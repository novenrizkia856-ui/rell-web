/* Header: a hairline appears once the page scrolls, the mobile sheet opens and
   closes, and the nav link for the section in view is marked. */
(function (RELL) {
  "use strict";

  function initSticky() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initSheet() {
    var sheet = document.querySelector("[data-sheet]");
    var opener = document.querySelector("[data-sheet-open]");
    if (!sheet || !opener) return;

    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      sheet.hidden = false;
      // Force a reflow so the transition has a start value to animate from.
      // requestAnimationFrame is paused while a tab is not painting, which
      // left the panel stuck at opacity zero.
      void sheet.offsetHeight;
      sheet.classList.add("is-open");
      opener.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = sheet.querySelector("a, button");
      if (first) first.focus();
    }

    function close() {
      sheet.classList.remove("is-open");
      opener.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        sheet.hidden = true;
      }, 320);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    opener.addEventListener("click", open);
    sheet.querySelectorAll("[data-sheet-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !sheet.hidden) close();
    });
  }

  function initActiveLink() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var link = byId[entry.target.id];
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  RELL.initHeader = function () {
    initSticky();
    initSheet();
    initActiveLink();
  };
})(window.RELL = window.RELL || {});
