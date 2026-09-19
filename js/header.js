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
    // Hover only opens on a real pointer. On touch, mouseenter fires on tap and
    // fought with the click handler.
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var groups = [];

    document.querySelectorAll("[data-dropdown]").forEach(function (group) {
      var trigger = group.querySelector("button");
      var menu = group.querySelector(".nav__menu");
      if (!trigger || !menu) return;

      // Clicking pins the menu open. Previously any mouseleave closed it, so
      // moving the pointer down toward the items dismissed it before you
      // could reach them.
      var pinned = false;
      var closeTimer = null;

      function cancelClose() {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
      }

      function close() {
        cancelClose();
        pinned = false;
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }

      function open() {
        cancelClose();
        groups.forEach(function (other) {
          if (other.group !== group) other.close();
        });
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }

      groups.push({ group: group, close: close });

      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        if (menu.hidden) {
          open();
          pinned = true;
        } else {
          close();
        }
      });

      if (canHover) {
        group.addEventListener("mouseenter", function () {
          cancelClose();
          if (menu.hidden) open();
        });

        group.addEventListener("mouseleave", function () {
          if (pinned) return;
          // A short grace period covers the pointer crossing the gap.
          cancelClose();
          closeTimer = window.setTimeout(close, 180);
        });
      }

      // Keyboard: open downward into the list, and wrap with the arrows.
      trigger.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          if (menu.hidden) {
            event.preventDefault();
            open();
            pinned = true;
            var first = menu.querySelector("a");
            if (first && event.key === "ArrowDown") first.focus();
          }
        }
      });

      menu.addEventListener("keydown", function (event) {
        var items = Array.prototype.slice.call(menu.querySelectorAll("a"));
        var i = items.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!items.length) return;
          var next = event.key === "ArrowDown" ? i + 1 : i - 1;
          if (next < 0) next = items.length - 1;
          if (next >= items.length) next = 0;
          items[next].focus();
        }
      });

      menu.addEventListener("click", function (event) {
        if (event.target.closest("a")) close();
      });

      // Focus leaving the group entirely closes it, so tabbing past behaves.
      group.addEventListener("focusout", function (event) {
        if (!group.contains(event.relatedTarget)) close();
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
