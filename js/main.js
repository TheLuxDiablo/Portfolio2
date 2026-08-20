document.addEventListener("DOMContentLoaded", function () {

  /* =======================================================
     ROSE QUARTZ PORTFOLIO
     PIXEL CURSOR
     ======================================================= */

  const isTouchDevice = window.matchMedia(
    "(hover: none), (pointer: coarse)"
  ).matches;

  if (isTouchDevice) return;


  /* -------------------------------------------------------
     CREATE CURSOR
     ------------------------------------------------------- */

  const cursor = document.createElement("img");

  cursor.id = "rq-pixel-cursor";

  cursor.src =
    "https://cdn.prod.website-files.com/687349e4c48611614b296b1e/6a87244a1c7206f1dd64ef71_Arrow2.png";

  cursor.alt = "";

  cursor.setAttribute("aria-hidden", "true");
  cursor.setAttribute("draggable", "false");

  document.body.appendChild(cursor);


  /* -------------------------------------------------------
     MOVE CURSOR
     ------------------------------------------------------- */

  document.addEventListener("mousemove", function (event) {
    cursor.style.transform =
      "translate3d(" +
      event.clientX +
      "px, " +
      event.clientY +
      "px, 0)";
  });


  /* -------------------------------------------------------
     ENTER / LEAVE WINDOW
     ------------------------------------------------------- */

  document.documentElement.addEventListener(
    "mouseleave",
    function () {
      cursor.style.visibility = "hidden";
    }
  );

  document.documentElement.addEventListener(
    "mouseenter",
    function () {
      cursor.style.visibility = "visible";
    }
  );


  /* -------------------------------------------------------
     TAB VISIBILITY
     ------------------------------------------------------- */

  document.addEventListener(
    "visibilitychange",
    function () {
      if (document.hidden) {
        cursor.style.visibility = "hidden";
      } else {
        cursor.style.visibility = "visible";
      }
    }
  );

});

/* =========================================================
   HEXAGON BACKGROUND
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const background = document.createElement("div");

  background.id = "rq-hex-background";


  /* -------------------------------------------------------
     HEX TILE
     ------------------------------------------------------- */

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="104"
      height="90"
      viewBox="0 0 104 90"
    >

      <g
        fill="none"
        stroke="#b983a9"
        stroke-opacity="0.28"
        stroke-width="1"
      >

        <path
          d="
            M26 0
            L78 0
            L104 45
            L78 90
            L26 90
            L0 45
            Z
          "
        />

        <path
          d="
            M-26 0
            L26 0
            L52 45
            L26 90
            L-26 90
            L-52 45
            Z
          "
        />

        <path
          d="
            M78 0
            L130 0
            L156 45
            L130 90
            L78 90
            L52 45
            Z
          "
        />

      </g>

    </svg>
  `;


  /* -------------------------------------------------------
     SVG -> CSS BACKGROUND
     ------------------------------------------------------- */

  const encodedSVG =
    "data:image/svg+xml," +
    encodeURIComponent(svg);

  background.style.backgroundImage =
    `url("${encodedSVG}")`;


  /* -------------------------------------------------------
     ADD TO PAGE
     ------------------------------------------------------- */

  document.body.prepend(background);

});