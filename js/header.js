/* Navigation: scroll state for the floating pill, the product dropdown,
   the mobile sheet and the active section link. */
(function (RELL) {
  "use strict";

  function initScrollState() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initDropdown() {
    document.querySelectorAll("[data-dropdown]").forEach(function (group) {
      var trigger = group.querySelector("button");
      var menu = group.querySelector(".nav__menu");
      if (!trigger || !menu) return;

      function close() {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }

      function open() {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }

      trigger.addEventListener("click", function () {
        if (menu.hidden) {
          open();
        } else {
          close();
        }
      });

      group.addEventListener("mouseenter", open);
      group.addEventListener("mouseleave", close);

      menu.addEventListener("click", function (event) {
        if (event.target.closest("a")) close();
      });

      document.addEventListener("click", function (event) {
        if (!menu.hidden && !group.contains(event.target)) close();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !menu.hidden) {
          close();
          trigger.focus();
        }
      });
    });
  }

  function initSheet() {
    var sheet = document.querySelector("[data-sheet]");
    var opener = document.querySelector("[data-sheet-open]");
    if (!sheet || !opener) return;
    var hideTimer = null;

    function open() {
      window.clearTimeout(hideTimer);
      sheet.hidden = false;
      opener.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          sheet.classList.add("is-open");
          var first = sheet.querySelector("a, button");
          if (first) first.focus({ preventScroll: true });
        });
      });
    }

    function close() {
      if (sheet.hidden) return;
      sheet.classList.remove("is-open");
      opener.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      hideTimer = window.setTimeout(function () {
        sheet.hidden = true;
      }, 380);
    }

    opener.addEventListener("click", open);
    sheet.querySelectorAll("[data-sheet-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !sheet.hidden) {
        close();
        opener.focus({ preventScroll: true });
      }
    });
    var desktop = window.matchMedia("(min-width: 900px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function (mq) {
        if (mq.matches) close();
      });
    }
  }

  function initActiveLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link[href^='#']"));
    if (!("IntersectionObserver" in window) || !links.length) return;

    var byId = {};
    links.forEach(function (link) {
      byId[link.getAttribute("href").slice(1)] = link;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var active = byId[entry.target.id];
          if (active) active.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  RELL.initHeader = function () {
    initScrollState();
    initDropdown();
    initSheet();
    initActiveLinks();
  };
})(window.RELL = window.RELL || {});
