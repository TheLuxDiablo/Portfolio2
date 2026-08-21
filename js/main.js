document.addEventListener("DOMContentLoaded", function () {

  /* =======================================================
     BACKGROUND ROOT
     ======================================================= */

  const SVG_NS = "http://www.w3.org/2000/svg";

  let backgroundRoot = document.getElementById("portfolio-background");

  if (!backgroundRoot) {
    backgroundRoot = document.createElement("div");
    backgroundRoot.id = "portfolio-background";
    backgroundRoot.setAttribute("aria-hidden", "true");
    document.body.prepend(backgroundRoot);
  }


  /* =======================================================
     HEXAGON SVG
     ======================================================= */

  let hexBackground = document.getElementById("portfolio-hex-background");

  if (!hexBackground) {
    hexBackground = document.createElementNS(SVG_NS, "svg");
    hexBackground.id = "portfolio-hex-background";
    hexBackground.setAttribute("aria-hidden", "true");
    backgroundRoot.appendChild(hexBackground);
  }

  let hexGrid = document.getElementById("portfolio-hex-grid");

  if (!hexGrid) {
    hexGrid = document.createElementNS(SVG_NS, "g");
    hexGrid.id = "portfolio-hex-grid";
    hexBackground.appendChild(hexGrid);
  }


  /* =======================================================
     CURSOR-REACTIVE BACKGROUND GLOW
     ======================================================= */

  let cursorGlow = document.getElementById("portfolio-cursor-glow");

  if (!cursorGlow) {
    cursorGlow = document.createElement("div");
    cursorGlow.id = "portfolio-cursor-glow";
    backgroundRoot.appendChild(cursorGlow);
  }


  /* =======================================================
     DITHER OVERLAY
     ======================================================= */

  let dither = document.getElementById("portfolio-dither-background");

  if (!dither) {
    dither = document.createElement("div");
    dither.id = "portfolio-dither-background";
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
        hex.setAttribute("class", "portfolio-hex");

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

  let cursor = document.getElementById("portfolio-pixel-cursor");

  if (!cursor) {
    cursor = document.createElement("img");

    cursor.id = "portfolio-pixel-cursor";

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
   NAME JUICE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const name = document.querySelector(".portfolio-name");

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

    span.className = "portfolio-name-letter";

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

    score.className = "portfolio-score-pop";

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

      particle.className = "portfolio-name-particle";

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
   GAME TILES
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const row = document.querySelector(".portfolio-games");

  const tiles = Array.from(
    document.querySelectorAll(".portfolio-game-tile")
  );

  if (!row || !tiles.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let selectedIndex = 0;
  let scrollTimer = null;
  let selectionTimer = null;


  /* -------------------------------------------------------
     EDGE CONTROLS
     ------------------------------------------------------- */

  const previousButton = document.createElement("button");
  previousButton.className =
    "portfolio-game-nav portfolio-game-nav-left";

  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "Previous game");

  const nextButton = document.createElement("button");
  nextButton.className =
    "portfolio-game-nav portfolio-game-nav-right";

  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Next game");

  document.body.appendChild(previousButton);
  document.body.appendChild(nextButton);


  /* -------------------------------------------------------
     SELECTION
     ------------------------------------------------------- */

  function setSelected(index, shouldScroll) {
    if (!tiles.length) return;

    selectedIndex =
      (index + tiles.length) % tiles.length;

    tiles.forEach(function (tile, tileIndex) {
      const selected = tileIndex === selectedIndex;

      tile.classList.toggle(
        "is-selected",
        selected
      );

      tile.setAttribute(
        "aria-selected",
        selected ? "true" : "false"
      );
    });

    if (shouldScroll) {
      scrollTileIntoView(tiles[selectedIndex]);
    }

    updateNavigation();
  }


  /* -------------------------------------------------------
     SCROLL TO TILE
     ------------------------------------------------------- */

  function scrollTileIntoView(tile) {
    const rowRect = row.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();

    const tileCenter =
      tile.offsetLeft +
      tile.offsetWidth / 2;

    const target =
      tileCenter -
      row.clientWidth / 2;

    const maxScroll =
      row.scrollWidth -
      row.clientWidth;

    const clampedTarget =
      Math.max(
        0,
        Math.min(target, maxScroll)
      );

    row.scrollTo({
      left: clampedTarget,
      behavior: reducedMotion
        ? "auto"
        : "smooth"
    });
  }


  /* -------------------------------------------------------
     NAV POSITION / VISIBILITY
     ------------------------------------------------------- */

  function updateNavigation() {
    const rect = row.getBoundingClientRect();

    document.documentElement.style.setProperty(
      "--game-nav-center-y",
      rect.top + rect.height / 2 + "px"
    );

    const maxScroll =
      Math.max(
        0,
        row.scrollWidth -
        row.clientWidth
      );

    const atStart =
      row.scrollLeft <= 2;

    const atEnd =
      row.scrollLeft >= maxScroll - 2;

    previousButton.classList.toggle(
      "is-hidden",
      atStart
    );

    nextButton.classList.toggle(
      "is-hidden",
      atEnd
    );

    const hasOverflow =
      maxScroll > 2;

    previousButton.classList.toggle(
      "has-overflow",
      hasOverflow
    );

    nextButton.classList.toggle(
      "has-overflow",
      hasOverflow
    );
  }


  /* -------------------------------------------------------
     TILE INTERACTION
     ------------------------------------------------------- */

  tiles.forEach(function (tile, index) {
    if (
      tile.tagName !== "A" &&
      !tile.hasAttribute("tabindex")
    ) {
      tile.setAttribute("tabindex", "0");
    }

    tile.setAttribute("role", "option");

    tile.addEventListener(
      "mouseenter",
      function () {
        tile.classList.add("is-hovering");

        /*
         * Hover can change the active selection, but it always
         * goes through the same single-selection function as
         * keyboard, arrows, and scrolling.
         */
        setSelected(index, false);
      }
    );

    tile.addEventListener(
      "mouseleave",
      function () {
        tile.classList.remove("is-hovering");
        tile.classList.remove("is-pressed");

        tile.style.setProperty(
          "--tile-x",
          "0px"
        );

        tile.style.setProperty(
          "--tile-y",
          "0px"
        );
      }
    );

    tile.addEventListener(
      "focus",
      function () {
        setSelected(index, true);
      }
    );

    tile.addEventListener(
      "mousedown",
      function () {
        tile.classList.add("is-pressed");
      }
    );

    tile.addEventListener(
      "mouseup",
      function () {
        tile.classList.remove("is-pressed");
      }
    );

    tile.addEventListener(
      "blur",
      function () {
        tile.classList.remove("is-pressed");

        tile.style.setProperty(
          "--tile-x",
          "0px"
        );

        tile.style.setProperty(
          "--tile-y",
          "0px"
        );
      }
    );

    if (!reducedMotion) {
      tile.addEventListener(
        "mousemove",
        function (event) {
          const rect =
            tile.getBoundingClientRect();

          const normalizedX =
            (event.clientX - rect.left) /
            rect.width -
            0.5;

          const normalizedY =
            (event.clientY - rect.top) /
            rect.height -
            0.5;

          const moveX =
            Math.round(normalizedX * 6);

          const moveY =
            Math.round(normalizedY * 6);

          tile.style.setProperty(
            "--tile-x",
            moveX + "px"
          );

          tile.style.setProperty(
            "--tile-y",
            moveY + "px"
          );
        }
      );
    }
  });


  /* -------------------------------------------------------
     EDGE BUTTONS
     ------------------------------------------------------- */

  previousButton.addEventListener(
    "click",
    function () {
      setSelected(
        selectedIndex - 1,
        true
      );

      tiles[selectedIndex].focus({
        preventScroll: true
      });
    }
  );

  nextButton.addEventListener(
    "click",
    function () {
      setSelected(
        selectedIndex + 1,
        true
      );

      tiles[selectedIndex].focus({
        preventScroll: true
      });
    }
  );


  /* -------------------------------------------------------
     KEYBOARD
     ------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        return;
      }

      const activeElement =
        document.activeElement;

      const gamesActive =
        row.matches(":hover") ||
        tiles.includes(activeElement);

      if (!gamesActive) return;

      event.preventDefault();

      const direction =
        event.key === "ArrowRight"
          ? 1
          : -1;

      setSelected(
        selectedIndex + direction,
        true
      );

      tiles[selectedIndex].focus({
        preventScroll: true
      });
    }
  );


  /* -------------------------------------------------------
     MOUSE WHEEL
     ------------------------------------------------------- */

  row.addEventListener(
    "wheel",
    function (event) {
      const dominantDelta =
        Math.abs(event.deltaX) >
        Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (dominantDelta === 0) return;

      event.preventDefault();

      row.classList.add("is-scrolling");

      clearTimeout(scrollTimer);

      row.scrollBy({
        left: dominantDelta,
        behavior: "auto"
      });

      scrollTimer = setTimeout(
        function () {
          row.classList.remove("is-scrolling");
        },
        140
      );
    },
    {
      passive: false
    }
  );


  /* -------------------------------------------------------
     SCROLL STATE
     ------------------------------------------------------- */

  row.addEventListener(
    "scroll",
    function () {
      updateNavigation();

      clearTimeout(selectionTimer);

      selectionTimer = setTimeout(
        function () {
          const rowCenter =
            row.getBoundingClientRect().left +
            row.clientWidth / 2;

          let closestIndex = 0;
          let closestDistance = Infinity;

          tiles.forEach(function (tile, index) {
            const rect =
              tile.getBoundingClientRect();

            const center =
              rect.left +
              rect.width / 2;

            const distance =
              Math.abs(center - rowCenter);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });

          /*
           * Use the same selection path as every other input.
           * This guarantees there is never more than one
           * .is-selected tile at a time.
           */
          setSelected(closestIndex, false);
        },
        80
      );
    },
    {
      passive: true
    }
  );


  /* -------------------------------------------------------
     RESIZE
     ------------------------------------------------------- */

  window.addEventListener(
    "resize",
    updateNavigation
  );

  window.addEventListener(
    "load",
    updateNavigation
  );


  /* -------------------------------------------------------
     INITIAL STATE
     ------------------------------------------------------- */

  setSelected(0, false);
  updateNavigation();
});

