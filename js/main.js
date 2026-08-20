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
   HEX BACKGROUND
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("rq-hex-background")) {
    return;
  }

  const background = document.createElement("div");

  background.id = "rq-hex-background";

  document.body.prepend(background);
});