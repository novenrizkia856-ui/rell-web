/* FAQ accordion. One answer open at a time.
   With JavaScript off every answer stays collapsed but reachable, so the
   panels are given ids and wired to their buttons here rather than in markup. */
(function (RELL) {
  "use strict";

  RELL.initFaq = function () {
    document.querySelectorAll("[data-faq]").forEach(function (list, listIndex) {
      var items = Array.prototype.slice.call(list.querySelectorAll(".faq-item"));

      items.forEach(function (item, index) {
        var head = item.querySelector(".faq-item__head");
        var body = item.querySelector(".faq-item__body");
        if (!head || !body) return;

        var id = "faq-" + listIndex + "-" + index;
        body.id = id;
        head.setAttribute("aria-controls", id);

        head.addEventListener("click", function () {
          var open = item.classList.contains("is-open");

          items.forEach(function (other) {
            other.classList.remove("is-open");
            var otherHead = other.querySelector(".faq-item__head");
            if (otherHead) otherHead.setAttribute("aria-expanded", "false");
          });

          if (!open) {
            item.classList.add("is-open");
            head.setAttribute("aria-expanded", "true");
          }
        });
      });
    });
  };
})(window.RELL = window.RELL || {});
