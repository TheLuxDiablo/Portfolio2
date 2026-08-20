document.addEventListener("DOMContentLoaded", function () {

  /* =======================================================
     BACKGROUND ROOT
     ======================================================= */

  const SVG_NS = "http://www.w3.org/2000/svg";

  let backgroundRoot = document.getElementById("rq-background");

  if (!backgroundRoot) {
    backgroundRoot = document.createElement("div");
    backgroundRoot.id = "rq-background";
    backgroundRoot.setAttribute("aria-hidden", "true");
    document.body.prepend(backgroundRoot);
  }


  /* =======================================================
     HEXAGON SVG
     ======================================================= */

  let hexBackground = document.getElementById("rq-hex-background");

  if (!hexBackground) {
    hexBackground = document.createElementNS(SVG_NS, "svg");
    hexBackground.id = "rq-hex-background";
    hexBackground.setAttribute("aria-hidden", "true");
    backgroundRoot.appendChild(hexBackground);
  }

  let hexGrid = document.getElementById("rq-hex-grid");

  if (!hexGrid) {
    hexGrid = document.createElementNS(SVG_NS, "g");
    hexGrid.id = "rq-hex-grid";
    hexBackground.appendChild(hexGrid);
  }


  /* =======================================================
     CURSOR-REACTIVE BACKGROUND GLOW
     ======================================================= */

  let cursorGlow = document.getElementById("rq-cursor-glow");

  if (!cursorGlow) {
    cursorGlow = document.createElement("div");
    cursorGlow.id = "rq-cursor-glow";
    backgroundRoot.appendChild(cursorGlow);
  }


  /* =======================================================
     DITHER OVERLAY
     ======================================================= */

  let dither = document.getElementById("rq-dither-background");

  if (!dither) {
    dither = document.createElement("div");
    dither.id = "rq-dither-background";
    backgroundRoot.appendChild(dither);
  }


  /* =======================================================
     BUILD HEX GRID
     ======================================================= */

  const HEX_SIDE = 28;
  const PIXEL_STEP = 2;

  let hexData = [];

  function snap(value) {
    return Math.round(value / PIXEL_STEP) * PIXEL_STEP;
  }

  function buildHexGrid() {
    while (hexGrid.firstChild) {
      hexGrid.removeChild(hexGrid.firstChild);
    }

    hexData = [];

    const side = HEX_SIDE;
    const hexHeight = Math.sqrt(3) * side;

    const horizontalStep = side * 1.5;
    const verticalStep = hexHeight;

    const padding = 180;

    const width = window.innerWidth + padding * 2;
    const height = window.innerHeight + padding * 2;

    hexBackground.setAttribute(
      "viewBox",
      "0 0 " + window.innerWidth + " " + window.innerHeight
    );

    const startX = -padding;
    const startY = -padding;

    const columns =
      Math.ceil(width / horizontalStep) + 5;

    const rows =
      Math.ceil(height / verticalStep) + 5;

    for (let col = 0; col < columns; col++) {
      const centerX =
        startX +
        col * horizontalStep;

      const offsetY =
        col % 2 === 0
          ? 0
          : verticalStep / 2;

      for (let row = 0; row < rows; row++) {
        const centerY =
          startY +
          row * verticalStep +
          offsetY;

        const points = [
          [
            centerX - side / 2,
            centerY - hexHeight / 2
          ],
          [
            centerX + side / 2,
            centerY - hexHeight / 2
          ],
          [
            centerX + side,
            centerY
          ],
          [
            centerX + side / 2,
            centerY + hexHeight / 2
          ],
          [
            centerX - side / 2,
            centerY + hexHeight / 2
          ],
          [
            centerX - side,
            centerY
          ]
        ]
          .map(function (point) {
            return (
              snap(point[0]) +
              "," +
              snap(point[1])
            );
          })
          .join(" ");

        const hex =
          document.createElementNS(
            SVG_NS,
            "polygon"
          );

        hex.setAttribute("points", points);
        hex.setAttribute("class", "rq-hex");

        hexGrid.appendChild(hex);

        hexData.push({
          element: hex,
          x: centerX,
          y: centerY
        });
      }
    }
  }

  buildHexGrid();


  /* =======================================================
     CURSOR REACTION
     ======================================================= */

  let lastHotHex = null;
  let nearbyHexes = [];

  function clearHexHighlights() {
    if (lastHotHex) {
      lastHotHex.classList.remove("is-hot");
      lastHotHex = null;
    }

    nearbyHexes.forEach(function (hex) {
      hex.classList.remove("is-near");
    });

    nearbyHexes = [];
  }

  function updateHexHover(mouseX, mouseY) {
    /*
     * The SVG grid itself is translated by the CSS animation.
     * A small radius still produces a convincing reactive
     * highlight without needing to reverse the animation math.
     */
    let closest = null;
    let closestDistance = Infinity;

    nearbyHexes.forEach(function (hex) {
      hex.classList.remove("is-near");
    });

    nearbyHexes = [];

    for (let i = 0; i < hexData.length; i++) {
      const item = hexData[i];

      const dx = item.x - mouseX;
      const dy = item.y - mouseY;

      const distanceSquared =
        dx * dx +
        dy * dy;

      if (distanceSquared < 7200) {
        item.element.classList.add("is-near");
        nearbyHexes.push(item.element);
      }

      if (distanceSquared < closestDistance) {
        closestDistance = distanceSquared;
        closest = item.element;
      }
    }

    if (lastHotHex && lastHotHex !== closest) {
      lastHotHex.classList.remove("is-hot");
    }

    if (closest && closestDistance < 3000) {
      closest.classList.add("is-hot");
      lastHotHex = closest;
    }
  }


  /* =======================================================
     RESIZE
     ======================================================= */

  let resizeTimer = null;

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function () {
      clearHexHighlights();
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

  let cursor = document.getElementById("rq-pixel-cursor");

  if (!cursor) {
    cursor = document.createElement("img");

    cursor.id = "rq-pixel-cursor";

    cursor.src =
      "https://cdn.prod.website-files.com/687349e4c48611614b296b1e/6a87244a1c7206f1dd64ef71_Arrow2.png";

    cursor.alt = "";

    cursor.setAttribute("aria-hidden", "true");
    cursor.setAttribute("draggable", "false");

    document.body.appendChild(cursor);
  }


  /* =======================================================
     MOUSE MOVEMENT
     ======================================================= */

  let hoverFrame = null;
  let latestMouseX = 0;
  let latestMouseY = 0;

  document.addEventListener("mousemove", function (event) {
    latestMouseX = event.clientX;
    latestMouseY = event.clientY;

    cursor.style.transform =
      "translate3d(" +
      latestMouseX +
      "px, " +
      latestMouseY +
      "px, 0)";

    /*
     * Snap the glow position to 4px increments so it moves
     * with a slightly crunchy/pixelated feel.
     */
    const glowX =
      Math.round((latestMouseX - 90) / 4) * 4;

    const glowY =
      Math.round((latestMouseY - 90) / 4) * 4;

    cursorGlow.style.transform =
      "translate3d(" +
      glowX +
      "px, " +
      glowY +
      "px, 0)";

    cursorGlow.style.opacity = "1";

    if (!hoverFrame) {
      hoverFrame = requestAnimationFrame(function () {
        updateHexHover(
          latestMouseX,
          latestMouseY
        );

        hoverFrame = null;
      });
    }
  });


  /* =======================================================
     ENTER / LEAVE
     ======================================================= */

  document.documentElement.addEventListener(
    "mouseleave",
    function () {
      cursor.style.visibility = "hidden";
      cursorGlow.style.opacity = "0";
      clearHexHighlights();
    }
  );

  document.documentElement.addEventListener(
    "mouseenter",
    function () {
      cursor.style.visibility = "visible";
    }
  );

  document.addEventListener(
    "visibilitychange",
    function () {
      const hidden = document.hidden;

      cursor.style.visibility =
        hidden
          ? "hidden"
          : "visible";

      cursorGlow.style.opacity =
        hidden
          ? "0"
          : cursorGlow.style.opacity;
    }
  );

});
/* =========================================================
   RQ NAME JUICE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const name = document.querySelector(".rq-name");

  if (!name) return;


  /* -------------------------------------------------------
     SPLIT NAME INTO LETTERS
     ------------------------------------------------------- */

  const originalText = name.textContent;

  name.textContent = "";

  const letters = [];

  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];

    const span = document.createElement("span");

    span.className = "rq-name-letter";

    if (char === " ") {
      span.innerHTML = "&nbsp;";
    } else {
      span.textContent = char;
    }

    name.appendChild(span);

    letters.push(span);
  }


  /* -------------------------------------------------------
     CLEAN LEFT-TO-RIGHT SHINE
     ------------------------------------------------------- */

  let shineTimers = [];

  function clearShine() {
    shineTimers.forEach(function (timer) {
      clearTimeout(timer);
    });

    shineTimers = [];

    letters.forEach(function (letter) {
      letter.classList.remove("is-shining");
    });
  }


  function playShine() {
    clearShine();

    letters.forEach(function (letter, index) {
      /*
       * Turn this letter on.
       */
      const startTimer = setTimeout(function () {
        letter.classList.add("is-shining");
      }, index * 55);

      /*
       * Turn it back off shortly afterward.
       */
      const endTimer = setTimeout(function () {
        letter.classList.remove("is-shining");
      }, index * 55 + 110);

      shineTimers.push(startTimer);
      shineTimers.push(endTimer);
    });
  }


  /* -------------------------------------------------------
     RANDOM SCORE POP
     ------------------------------------------------------- */

  function spawnScore() {
    const score = document.createElement("span");

    score.className = "rq-score-pop";

    /*
     * Arcade-y randomized score.
     * Always multiples of 10.
     */
    const amount =
      (Math.floor(Math.random() * 90) + 1) * 10;

    score.textContent = "+" + amount;

    /*
     * Don't make every score appear in exactly the same spot.
     */
    const horizontalOffset =
      Math.floor(Math.random() * 41) - 20;

    score.style.left =
      "calc(50% + " +
      horizontalOffset +
      "px)";

    name.appendChild(score);

    setTimeout(function () {
      score.remove();
    }, 600);
  }


  /* -------------------------------------------------------
     PIXEL PARTICLES
     ------------------------------------------------------- */

  function spawnParticles() {
    const count = 8;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");

      particle.className = "rq-name-particle";

      const angle =
        (Math.PI * 2 * i) / count;

      const distance =
        18 + Math.random() * 24;

      const x =
        Math.cos(angle) * distance;

      const y =
        Math.sin(angle) * distance;

      particle.style.setProperty(
        "--particle-x",
        x + "px"
      );

      particle.style.setProperty(
        "--particle-y",
        y + "px"
      );

      if (Math.random() > 0.5) {
        particle.style.background =
          "#f0b6db";
      }

      name.appendChild(particle);

      setTimeout(function () {
        particle.remove();
      }, 550);
    }
  }


  /* -------------------------------------------------------
     HOVER
     ------------------------------------------------------- */

  name.addEventListener("mouseenter", function () {
    name.classList.add("is-hovering");

    playShine();
  });


  name.addEventListener("mouseleave", function () {
    name.classList.remove("is-hovering");
    name.classList.remove("is-pressed");

    clearShine();
  });


  /* -------------------------------------------------------
     PRESS
     ------------------------------------------------------- */

  name.addEventListener("mousedown", function () {
    name.classList.add("is-pressed");
  });


  name.addEventListener("mouseup", function () {
    name.classList.remove("is-pressed");
  });


  /* -------------------------------------------------------
     CLICK
     ------------------------------------------------------- */

  name.addEventListener("click", function () {
    /*
     * No flash or color change here.
     * The press/release handles the squeeze.
     */

    spawnScore();
    spawnParticles();
  });
});

/* =========================================================
   RQ PIXEL NAV
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const navItems = [
    {
      id: "profile",
      label: "Profile",
      color: "#ff5a5f",
      href: "/profile",
      icon: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="12" y="5" width="8" height="8" />
          <rect x="9" y="15" width="14" height="3" />
          <rect x="6" y="18" width="20" height="9" />
        </svg>
      `
    },
    {
      id: "home",
      label: "Home",
      color: "#ff9f43",
      href: "/",
      icon: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 15 L16 5 L28 15 V27 H19 V19 H13 V27 H4 Z" />
        </svg>
      `
    },
    {
      id: "experience",
      label: "Experience",
      color: "#ffd93d",
      href: "/experience",
      icon: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="4" y="11" width="24" height="16" />
          <rect x="11" y="6" width="10" height="5" />
          <rect x="14" y="17" width="4" height="3" fill="#09090b" />
        </svg>
      `
    },
    {
      id: "projects",
      label: "Projects",
      color: "#5fd068",
      href: "/projects",
      icon: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M7 11 H25 L29 17 V24 H23 L20 21 H12 L9 24 H3 V17 Z" />
          <rect x="9" y="14" width="3" height="10" fill="#09090b" />
          <rect x="6" y="18" width="9" height="3" fill="#09090b" />
          <rect x="21" y="15" width="3" height="3" fill="#09090b" />
          <rect x="24" y="19" width="3" height="3" fill="#09090b" />
        </svg>
      `
    },
    {
      id: "resume",
      label: "Resume",
      color: "#54a0ff",
      href: "/resume",
      icon: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M7 4 H20 L25 9 V28 H7 Z" />
          <path d="M20 4 V9 H25" fill="#09090b" />
          <rect x="11" y="13" width="10" height="2" fill="#09090b" />
          <rect x="11" y="18" width="10" height="2" fill="#09090b" />
          <rect x="11" y="23" width="7" height="2" fill="#09090b" />
        </svg>
      `
    },
    {
      id: "contact",
      label: "Contact",
      color: "#a66cff",
      href: "/contact",
      icon: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="4" y="7" width="24" height="18" />
          <path d="M4 9 L16 18 L28 9 V13 L16 22 L4 13 Z" fill="#09090b" />
        </svg>
      `
    }
  ];

  let nav = document.getElementById("rq-top-nav");

  if (!nav) {
    nav = document.createElement("nav");
    nav.id = "rq-top-nav";
    nav.setAttribute("aria-label", "Portfolio navigation");
    document.body.appendChild(nav);
  }

  nav.innerHTML = "";

  navItems.forEach(function (item) {
    const button = document.createElement("a");

    button.className =
      "rq-nav-button rq-nav-" + item.id;

    button.href = item.href;
    button.setAttribute("aria-label", item.label);
    button.style.setProperty("--nav-color", item.color);

    const icon = document.createElement("span");
    icon.className = "rq-nav-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = item.icon;

    button.appendChild(icon);

    const label = document.createElement("span");
    label.className = "rq-nav-label";
    label.textContent = item.label;

    button.appendChild(label);
    nav.appendChild(button);
  });

  const currentPath =
    window.location.pathname.replace(/\/+$/, "") || "/";

  const buttons =
    nav.querySelectorAll(".rq-nav-button");

  buttons.forEach(function (button) {
    const href = button.getAttribute("href");

    if (!href) return;

    const normalizedHref =
      href.replace(/\/+$/, "") || "/";

    if (normalizedHref === currentPath) {
      button.classList.add("is-active");
    }
  });

});
