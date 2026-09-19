/* FAQ accordion. One answer open at a time.

   The panel height is measured and set in pixels, so the open and close
   animation runs in every browser, then released to auto once it settles so a
   resize or a font swap cannot clip the text. */
(function (RELL) {
  "use strict";

  RELL.initFaq = function () {
    document.querySelectorAll("[data-faq]").forEach(function (list, listIndex) {
      var items = Array.prototype.slice.call(list.querySelectorAll(".faq-item"));
      var openItem = null;

      function inner(item) {
        return item.querySelector(".faq-item__body > div") || item.querySelector(".faq-item__body");
      }

      /* The panel is released to auto once the animation is done. transitionend
         is the fast path; the timer is the guarantee, since a browser that
         skips or interrupts the transition never fires that event. Each item
         keeps its own timer, so closing one cannot cancel another's reset. */
      var timers = new WeakMap();

      function settle(item) {
        window.clearTimeout(timers.get(item));
        timers.set(item, window.setTimeout(function () {
          var body = item.querySelector(".faq-item__body");
          body.style.height = item.classList.contains("is-open") ? "auto" : "0px";
        }, 450));
      }

      function close(item) {
        var body = item.querySelector(".faq-item__body");
        var head = item.querySelector(".faq-item__head");
        body.style.height = inner(item).offsetHeight + "px";
        requestAnimationFrame(function () {
          body.style.height = "0px";
        });
        item.classList.remove("is-open");
        head.setAttribute("aria-expanded", "false");
        if (openItem === item) openItem = null;
        settle(item);
      }

      function open(item) {
        var body = item.querySelector(".faq-item__body");
        var head = item.querySelector(".faq-item__head");
        item.classList.add("is-open");
        head.setAttribute("aria-expanded", "true");
        body.style.height = inner(item).offsetHeight + "px";
        openItem = item;
        settle(item);
      }

      items.forEach(function (item, index) {
        var head = item.querySelector(".faq-item__head");
        var body = item.querySelector(".faq-item__body");
        if (!head || !body) return;

        var id = "faq-" + listIndex + "-" + index;
        body.id = id;
        head.setAttribute("aria-controls", id);
        head.setAttribute("aria-expanded", "false");
        body.style.height = "0px";

        body.addEventListener("transitionend", function (event) {
          if (event.propertyName !== "height") return;
          // Release to auto while open so later reflows cannot clip the answer.
          body.style.height = item.classList.contains("is-open") ? "auto" : "0px";
        });

        head.addEventListener("click", function () {
          var isOpen = item.classList.contains("is-open");
          if (openItem && openItem !== item) close(openItem);
          if (isOpen) {
            close(item);
          } else {
            open(item);
          }
        });
      });

      window.addEventListener("resize", function () {
        if (openItem) openItem.querySelector(".faq-item__body").style.height = "auto";
      });
    });
  };
})(window.RELL = window.RELL || {});
