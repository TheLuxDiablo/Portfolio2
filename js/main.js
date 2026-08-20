/* =========================================================
   ROSE QUARTZ PORTFOLIO
   Custom Cursor
   ========================================================= */

/*
 * The pixel cursor is handled natively by CSS.
 *
 * We're intentionally not creating a custom HTML cursor
 * that follows the mouse. Native CSS cursors have no
 * visible tracking delay and feel much more responsive.
 */

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("cursor-ready");
});