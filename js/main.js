document.addEventListener("DOMContentLoaded", function () {

  /* =======================================================
     LOOPING HEXAGON BACKGROUND
     ======================================================= */

  const SVG_NS = "http://www.w3.org/2000/svg";

  let hexBackground = document.getElementById("rq-hex-background");

  if (!hexBackground) {
    hexBackground = document.createElementNS(SVG_NS, "svg");
    hexBackground.id = "rq-hex-background";
    hexBackground.setAttribute("aria-hidden", "true");
    hexBackground.setAttribute("preserveAspectRatio", "none");

    document.body.prepend(hexBackground);
  }

  let hexGrid = document.getElementById("rq-hex-grid");

  if (!hexGrid) {
    hexGrid = document.createElementNS(SVG_NS, "g");
    hexGrid.id = "rq-hex-grid";
    hexBackground.appendChild(hexGrid);
  }

  function buildHexGrid() {
    while (hexGrid.firstChild) {
      hexGrid.removeChild(hexGrid.firstChild);
    }

    const side = 2;
    const hexWidth = side * 2;
    const hexHeight = Math.sqrt(3) * side;

    const horizontalStep = side * 1.5;
    const verticalStep = hexHeight;

    const padding = 180;

    const width = window.innerWidth + padding * 2;
    const height = window.innerHeight + padding * 2;

    hexBackground.setAttribute(
      "viewBox",
      `0 0 ${window.innerWidth} ${window.innerHeight}`
    );

    const startX = -padding;
    const startY = -padding;

    const columns = Math.ceil(width / horizontalStep) + 3;
    const rows = Math.ceil(height / verticalStep) + 3;

    for (let col = 0; col < columns; col++) {
      const centerX = startX + col * horizontalStep;
      const offsetY = col % 2 === 0 ? 0 : verticalStep / 2;

      for (let row = 0; row < rows; row++) {
        const centerY =
          startY +
          row * verticalStep +
          offsetY;

        const points = [
          [centerX - side / 2, centerY - hexHeight / 2],
          [centerX + side / 2, centerY - hexHeight / 2],
          [centerX + side, centerY],
          [centerX + side / 2, centerY + hexHeight / 2],
          [centerX - side / 2, centerY + hexHeight / 2],
          [centerX - side, centerY]
        ]
          .map(function (point) {
            return point[0] + "," + point[1];
          })
          .join(" ");

        const hex = document.createElementNS(SVG_NS, "polygon");

        hex.setAttribute("points", points);
        hex.setAttribute("class", "rq-hex");

        hexGrid.appendChild(hex);
      }
    }
  }

  buildHexGrid();

  let resizeTimer = null;

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function () {
      buildHexGrid();
    }, 120);
  });


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
