document.addEventListener("DOMContentLoaded", () => {
  // Don't create the cursor on touch devices
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    return;
  }

  const cursor = document.createElement("div");
  cursor.className = "pixel-cursor";

  document.body.appendChild(cursor);

  let mouseX = -100;
  let mouseY = -100;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  // Clickable elements
  const interactiveSelector = `
    a,
    button,
    [role="button"],
    input,
    select,
    textarea,
    summary,
    .w-button,
    [data-cursor="hover"]
  `;

  document.addEventListener("mouseover", (event) => {
    if (event.target.closest(interactiveSelector)) {
      cursor.classList.add("is-hovering");
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target.closest(interactiveSelector)) {
      cursor.classList.remove("is-hovering");
    }
  });

  document.addEventListener("mousedown", () => {
    cursor.classList.add("is-clicking");
  });

  document.addEventListener("mouseup", () => {
    cursor.classList.remove("is-clicking");
  });

  // Hide when mouse leaves browser window
  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });

  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
  });
});