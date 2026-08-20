document.addEventListener("DOMContentLoaded", function () {

  /* =======================================================
     LOOPING HEXAGON BACKGROUND
     ======================================================= */

  if (!document.getElementById("rq-hex-background")) {
    const SVG_NS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.id = "rq-hex-background";
    svg.setAttribute("aria-hidden", "true");

    const defs = document.createElementNS(SVG_NS, "defs");

    const pattern = document.createElementNS(SVG_NS, "pattern");
    pattern.id = "rq-hex-pattern";
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "156");
    pattern.setAttribute("height", "90");

    /*
     * Flat-top honeycomb.
     *
     * One complete hex sits on the left.
     * The partial hexes on the right complete the staggered
     * neighboring column when the SVG pattern repeats.
     */
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      [
        "M26 0 L78 0 L104 45 L78 90 L26 90 L0 45 Z",
        "M104 -45 L156 -45 L182 0 L156 45 L104 45 L78 0 Z",
        "M104 45 L156 45 L182 90 L156 135 L104 135 L78 90 Z"
      ].join(" ")
    );

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#b983a9");
    path.setAttribute("stroke-opacity", "0.34");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("vector-effect", "non-scaling-stroke");

    pattern.appendChild(path);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "url(#rq-hex-pattern)");

    svg.appendChild(rect);

    document.body.prepend(svg);
  }


  /* =======================================================
     PIXEL CURSOR
     ======================================================= */

  const isTouchDevice = window.matchMedia(
    "(hover: none), (pointer: coarse)"
  ).matches;

  if (isTouchDevice) return;

  if (document.getElementById("rq-pixel-cursor")) return;

  const cursor = document.createElement("img");

  cursor.id = "rq-pixel-cursor";
  cursor.src =
    "https://cdn.prod.website-files.com/687349e4c48611614b296b1e/6a87244a1c7206f1dd64ef71_Arrow2.png";

  cursor.alt = "";
  cursor.setAttribute("aria-hidden", "true");
  cursor.setAttribute("draggable", "false");

  document.body.appendChild(cursor);

  document.addEventListener("mousemove", function (event) {
    cursor.style.transform =
      "translate3d(" +
      event.clientX +
      "px, " +
      event.clientY +
      "px, 0)";
  });

  document.documentElement.addEventListener("mouseleave", function () {
    cursor.style.visibility = "hidden";
  });

  document.documentElement.addEventListener("mouseenter", function () {
    cursor.style.visibility = "visible";
  });

  document.addEventListener("visibilitychange", function () {
    cursor.style.visibility = document.hidden ? "hidden" : "visible";
  });

});
