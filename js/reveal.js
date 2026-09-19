/* Scroll reveal. Replaces framer motion "whileInView, once" from the reference.
   data-reveal-y         start offset in px (15, 20 or 14 in the reference)
   data-reveal-duration  seconds (0.5, 0.6 or 0.35)
   data-reveal-delay     seconds (0.04 x row index for table rows)
   data-reveal-margin    viewport margin (-60px, -80px or -40px) */
(function (RELL) {
  "use strict";

  RELL.initReveal = function () {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-revealed");
      });
      return;
    }

    var groups = {};
    nodes.forEach(function (node) {
      var y = node.getAttribute("data-reveal-y");
      var duration = node.getAttribute("data-reveal-duration");
      var delay = node.getAttribute("data-reveal-delay");
      if (y) node.style.setProperty("--reveal-y", y + "px");
      if (duration) node.style.setProperty("--reveal-duration", duration + "s");
      if (delay) node.style.setProperty("--reveal-delay", delay + "s");

      var margin = node.getAttribute("data-reveal-margin") || "0px";
      (groups[margin] = groups[margin] || []).push(node);
    });

    Object.keys(groups).forEach(function (margin) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: margin + " 0px " + margin + " 0px" }
      );
      groups[margin].forEach(function (node) {
        observer.observe(node);
      });
    });
  };
})(window.RELL = window.RELL || {});
