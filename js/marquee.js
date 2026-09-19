/* Auto scrolling track, ported from the reference component.
   36 px per second, frame delta capped at 0.1s, pauses while hovered,
   pauses 1.5s after wheel, pointer or manual scroll, wraps seamlessly.
   The track is repeated until it holds at least 16 items, then a hidden
   loop copy is appended so the wrap point is invisible. */
(function (RELL) {
  "use strict";

  function hideClone(node) {
    node.setAttribute("aria-hidden", "true");
    node.querySelectorAll("a, button, [tabindex]").forEach(function (el) {
      el.setAttribute("tabindex", "-1");
    });
  }

  function setup(scroller) {
    var track = scroller.querySelector("[data-marquee-track]");
    if (!track) return;
    var speed = parseFloat(scroller.getAttribute("data-marquee-speed")) || 36;
    var minItems = parseInt(scroller.getAttribute("data-marquee-min"), 10) || 16;

    var originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;
    var copies = Math.max(1, Math.ceil(minItems / originals.length));
    for (var c = 1; c < copies; c++) {
      originals.forEach(function (item) {
        var clone = item.cloneNode(true);
        hideClone(clone);
        track.appendChild(clone);
      });
    }

    var loop = track.cloneNode(true);
    loop.removeAttribute("data-marquee-track");
    hideClone(loop);
    track.parentNode.appendChild(loop);

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var width = 0;
    var measure = function () {
      width = track.scrollWidth;
    };
    measure();
    if ("ResizeObserver" in window) {
      new ResizeObserver(measure).observe(track);
    } else {
      window.addEventListener("resize", measure);
    }

    var resumeAt = 0;
    var hovering = false;
    var last = 0;
    var pos = scroller.scrollLeft;

    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      var current = scroller.scrollLeft;

      if (width > 0 && Math.abs(current - pos) > 2) {
        resumeAt = now + 1500;
        pos = current;
      }

      if (hovering || now < resumeAt || width <= 0 || reduce.matches) {
        if (width > 0 && current >= 2 * width - 1) {
          scroller.scrollLeft = current - width;
          pos = scroller.scrollLeft;
        } else if (width > 0 && current < 0) {
          scroller.scrollLeft = current + width;
          pos = scroller.scrollLeft;
        }
      } else {
        pos += speed * dt;
        if (pos >= width) pos -= width;
        scroller.scrollLeft = pos;
      }
      requestAnimationFrame(frame);
    }

    function pause() {
      resumeAt = performance.now() + 1500;
    }

    requestAnimationFrame(frame);
    scroller.addEventListener("mouseenter", function () { hovering = true; });
    scroller.addEventListener("mouseleave", function () { hovering = false; });
    scroller.addEventListener("focusin", function () { hovering = true; });
    scroller.addEventListener("focusout", function () { hovering = false; });
    scroller.addEventListener("pointerdown", pause);
    scroller.addEventListener("wheel", pause, { passive: true });
  }

  RELL.initMarquee = function () {
    document.querySelectorAll("[data-marquee]").forEach(setup);
  };
})(window.RELL = window.RELL || {});
