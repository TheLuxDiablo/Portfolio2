document.addEventListener("DOMContentLoaded", function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  let bg = document.getElementById("rq-hex-background");
  if (!bg) {
    bg = document.createElementNS(SVG_NS, "svg");
    bg.id = "rq-hex-background";
    bg.setAttribute("aria-hidden", "true");
    document.body.prepend(bg);
  }

  let grid = document.getElementById("rq-hex-grid");
  if (!grid) {
    grid = document.createElementNS(SVG_NS, "g");
    grid.id = "rq-hex-grid";
    bg.appendChild(grid);
  }

  if (!document.getElementById("rq-dither-background")) {
    const dither = document.createElement("div");
    dither.id = "rq-dither-background";
    bg.insertAdjacentElement("afterend", dither);
  }

  function buildHexGrid() {
    while (grid.firstChild) grid.removeChild(grid.firstChild);

    const side = 28;
    const hexHeight = Math.sqrt(3) * side;
    const horizontalStep = side * 1.5;
    const verticalStep = hexHeight;
    const pixelStep = 2;
    const snap = value => Math.round(value / pixelStep) * pixelStep;
    const padding = 180;
    const width = window.innerWidth + padding * 2;
    const height = window.innerHeight + padding * 2;

    bg.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);

    const columns = Math.ceil(width / horizontalStep) + 4;
    const rows = Math.ceil(height / verticalStep) + 4;

    for (let col = 0; col < columns; col++) {
      const cx = -padding + col * horizontalStep;
      const offsetY = col % 2 === 0 ? 0 : verticalStep / 2;

      for (let row = 0; row < rows; row++) {
        const cy = -padding + row * verticalStep + offsetY;

        const points = [
          [cx-side/2, cy-hexHeight/2],
          [cx+side/2, cy-hexHeight/2],
          [cx+side, cy],
          [cx+side/2, cy+hexHeight/2],
          [cx-side/2, cy+hexHeight/2],
          [cx-side, cy]
        ].map(p => snap(p[0]) + "," + snap(p[1])).join(" ");

        const hex = document.createElementNS(SVG_NS, "polygon");
        hex.setAttribute("points", points);
        hex.setAttribute("class", "rq-hex");
        grid.appendChild(hex);
      }
    }
  }

  buildHexGrid();

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildHexGrid, 120);
  });

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (isTouch || document.getElementById("rq-pixel-cursor")) return;

  const cursor = document.createElement("img");
  cursor.id = "rq-pixel-cursor";
  cursor.src = "https://cdn.prod.website-files.com/687349e4c48611614b296b1e/6a87244a1c7206f1dd64ef71_Arrow2.png";
  cursor.alt = "";
  cursor.setAttribute("aria-hidden","true");
  cursor.setAttribute("draggable","false");
  document.body.appendChild(cursor);

  document.addEventListener("mousemove", e => {
    cursor.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
  });
  document.documentElement.addEventListener("mouseleave", () => cursor.style.visibility = "hidden");
  document.documentElement.addEventListener("mouseenter", () => cursor.style.visibility = "visible");
  document.addEventListener("visibilitychange", () => cursor.style.visibility = document.hidden ? "hidden" : "visible");
});
