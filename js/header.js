/* Header behaviour: scrolled background (threshold 32px, as in the reference),
   network dropdown, mobile sheet, floating orb and active nav link. */
(function (RELL) {
  "use strict";

  function initScrollState() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 32);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initDropdowns() {
    document.querySelectorAll("[data-dropdown]").forEach(function (root) {
      var trigger = root.querySelector(".dropdown__trigger");
      var menu = root.querySelector(".dropdown__menu");
      if (!trigger || !menu) return;

      function close(focusTrigger) {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        if (focusTrigger) trigger.focus();
      }

      function open() {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        var first = menu.querySelector("[role='menuitem']");
        if (first) first.focus();
      }

      trigger.addEventListener("click", function () {
        if (menu.hidden) {
          open();
        } else {
          close(false);
        }
      });

      document.addEventListener("click", function (event) {
        if (!menu.hidden && !root.contains(event.target)) close(false);
      });

      root.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !menu.hidden) {
          close(true);
          return;
        }
        if (menu.hidden || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
        var items = Array.prototype.slice.call(menu.querySelectorAll("[role='menuitem']"));
        var index = items.indexOf(document.activeElement);
        var next = event.key === "ArrowDown" ? index + 1 : index - 1;
        items[(next + items.length) % items.length].focus();
        event.preventDefault();
      });
    });
  }

  function initSheet() {
    var sheet = document.querySelector("[data-sheet]");
    var openBtn = document.querySelector("[data-sheet-open]");
    if (!sheet || !openBtn) return;
    var panel = sheet.querySelector(".sheet__panel");
    var hideTimer = null;

    function open() {
      window.clearTimeout(hideTimer);
      sheet.hidden = false;
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          sheet.classList.add("is-open");
          var focusable = panel.querySelector("button");
          if (focusable) focusable.focus({ preventScroll: true });
        });
      });
    }

    function close() {
      if (sheet.hidden) return;
      sheet.classList.remove("is-open");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      hideTimer = window.setTimeout(function () {
        sheet.hidden = true;
      }, 320);
    }

    openBtn.addEventListener("click", open);
    sheet.querySelectorAll("[data-sheet-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !sheet.hidden) {
        close();
        openBtn.focus({ preventScroll: true });
      }
    });
    var desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function (mq) {
        if (mq.matches) close();
      });
    }
  }

  function initOrb() {
    var orb = document.querySelector("[data-orb]");
    if (!orb) return;
    var closeBtn = orb.querySelector("[data-orb-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        orb.hidden = true;
      });
    }
  }

  function initActiveLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
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
    initDropdowns();
    initSheet();
    initOrb();
    initActiveLinks();
  };
})(window.RELL = window.RELL || {});
