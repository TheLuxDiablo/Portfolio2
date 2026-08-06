<script>
  document.addEventListener("DOMContentLoaded", () => {
    const buttons = Array.from(
      document.querySelectorAll(".console-nav-button")
    );

    const panels = Array.from(
      document.querySelectorAll(".console-panel")
    );

    if (!buttons.length || !panels.length) {
      console.warn(
        "Console navigation could not initialize because no buttons or panels were found."
      );

      return;
    }

    function openPanel(panelName, options = {}) {
      const {
        focusButton = false,
        updateHash = false
      } = options;

      const selectedButton = buttons.find(
        button => button.dataset.panel === panelName
      );

      const selectedPanel = panels.find(
        panel => panel.dataset.panelContent === panelName
      );

      if (!selectedButton || !selectedPanel) {
        console.warn(
          `No matching console button and panel were found for "${panelName}".`
        );

        return;
      }

      buttons.forEach(button => {
        const isSelected = button === selectedButton;

        button.classList.toggle("is-active", isSelected);

        button.setAttribute(
          "aria-selected",
          String(isSelected)
        );

        button.setAttribute(
          "tabindex",
          isSelected ? "0" : "-1"
        );
      });

      panels.forEach(panel => {
        const isSelected = panel === selectedPanel;

        panel.classList.toggle("is-active", isSelected);
        panel.setAttribute("aria-hidden", String(!isSelected));

        if (isSelected) {
          panel.removeAttribute("inert");
        } else {
          panel.setAttribute("inert", "");
        }
      });

      if (focusButton) {
        selectedButton.focus({
          preventScroll: true
        });
      }

      selectedButton.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth",
        block: "nearest",
        inline: "center"
      });

      if (updateHash) {
        history.replaceState(
          null,
          "",
          `#${panelName}`
        );
      }
    }

    buttons.forEach((button, index) => {
      button.setAttribute("role", "tab");

      button.addEventListener("click", event => {
        event.preventDefault();

        openPanel(button.dataset.panel, {
          updateHash: true
        });
      });

      button.addEventListener("keydown", event => {
        let nextIndex = index;

        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
            nextIndex = (index + 1) % buttons.length;
            break;

          case "ArrowLeft":
          case "ArrowUp":
            nextIndex =
              (index - 1 + buttons.length) %
              buttons.length;
            break;

          case "Home":
            nextIndex = 0;
            break;

          case "End":
            nextIndex = buttons.length - 1;
            break;

          case "Enter":
          case " ":
            event.preventDefault();

            openPanel(button.dataset.panel, {
              updateHash: true
            });

            return;

          default:
            return;
        }

        event.preventDefault();

        const nextButton = buttons[nextIndex];

        openPanel(nextButton.dataset.panel, {
          focusButton: true,
          updateHash: true
        });
      });
    });

    panels.forEach(panel => {
      panel.setAttribute("role", "tabpanel");
    });

    const hashPanel = window.location.hash.replace("#", "");

    const hashMatchesPanel = buttons.some(
      button => button.dataset.panel === hashPanel
    );

    const initiallyActiveButton =
      hashMatchesPanel
        ? buttons.find(
            button => button.dataset.panel === hashPanel
          )
        : document.querySelector(
            ".console-nav-button.is-active"
          ) || buttons[0];

    openPanel(initiallyActiveButton.dataset.panel);
  });
</script>