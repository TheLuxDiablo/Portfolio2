<script>
  document.addEventListener("DOMContentLoaded", () => {
    /* ========================================
       ELEMENTS
    ======================================== */

    const buttons = Array.from(
      document.querySelectorAll(".console-nav-button")
    );

    const panels = Array.from(
      document.querySelectorAll(".console-panel")
    );

    const clock = document.querySelector(".console-time");
    const music = document.querySelector("audio.console-music");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    /* ========================================
       MUSIC SETTINGS
    ======================================== */

    const MUSIC_TARGET_VOLUME = 0.2;
    const MUSIC_FADE_DURATION = 500;

    let audioUnlocked = false;
    let musicFadeFrame = null;

    if (music) {
      music.volume = 0;
    }

    /* ========================================
       CLOCK
    ======================================== */

    function updateClock() {
      if (!clock) return;

      const now = new Date();

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");

      const period = hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12;

      clock.textContent = `${hours}:${minutes} ${period}`;
    }

    if (clock) {
      updateClock();
      setInterval(updateClock, 1000);
    }

    /* ========================================
       MUSIC HELPERS
    ======================================== */

    function isHomeOpen() {
      const activeButton = document.querySelector(
        ".console-nav-button.is-active"
      );

      return activeButton?.dataset.panel === "home";
    }

    function cancelMusicFade() {
      if (musicFadeFrame !== null) {
        cancelAnimationFrame(musicFadeFrame);
        musicFadeFrame = null;
      }
    }

    function fadeMusicTo(targetVolume, duration, onComplete = null) {
      if (!music) return;

      cancelMusicFade();

      if (prefersReducedMotion.matches || duration <= 0) {
        music.volume = targetVolume;

        if (onComplete) {
          onComplete();
        }

        return;
      }

      const startVolume = music.volume;
      const volumeDifference = targetVolume - startVolume;
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        /*
          Smoothstep easing.
          Feels softer than a straight linear volume fade.
        */
        const easedProgress =
          progress * progress * (3 - 2 * progress);

        music.volume =
          startVolume +
          volumeDifference * easedProgress;

        if (progress < 1) {
          musicFadeFrame = requestAnimationFrame(step);
        } else {
          music.volume = targetVolume;
          musicFadeFrame = null;

          if (onComplete) {
            onComplete();
          }
        }
      }

      musicFadeFrame = requestAnimationFrame(step);
    }

    async function fadeMusicIn() {
      if (!music || !audioUnlocked || !isHomeOpen()) return;

      cancelMusicFade();

      try {
        /*
          Start at silence if the track is currently paused.
          If it was already fading out, retain its current volume.
        */
        if (music.paused) {
          music.volume = 0;
          await music.play();
        }

        fadeMusicTo(
          MUSIC_TARGET_VOLUME,
          MUSIC_FADE_DURATION
        );
      } catch (error) {
        console.warn(
          "Music playback was blocked by the browser:",
          error
        );
      }
    }

    function fadeMusicOut() {
      if (!music || music.paused) return;

      fadeMusicTo(
        0,
        MUSIC_FADE_DURATION,
        () => {
          /*
            Only pause if Home hasn't become active again
            while the fade was happening.
          */
          if (!isHomeOpen()) {
            music.pause();
          }
        }
      );
    }

    function updateMusic() {
      if (!music || !audioUnlocked) return;

      if (isHomeOpen()) {
        fadeMusicIn();
      } else {
        fadeMusicOut();
      }
    }

    /* ========================================
       AUDIO UNLOCK
    ======================================== */

    async function unlockAudio() {
      if (!music || audioUnlocked) return;

      /*
        Browsers require play() to happen as part of a
        real user gesture. If Home is active, start the
        track directly from this interaction.
      */
      if (isHomeOpen()) {
        try {
          music.volume = 0;

          await music.play();

          audioUnlocked = true;

          fadeMusicTo(
            MUSIC_TARGET_VOLUME,
            MUSIC_FADE_DURATION
          );
        } catch (error) {
          console.warn(
            "Audio could not be unlocked:",
            error
          );

          return;
        }
      } else {
        /*
          We still mark audio as unlocked after the user
          interacts elsewhere. Playback will begin when
          they later navigate to Home.
        */
        audioUnlocked = true;
      }

      window.removeEventListener(
        "pointerdown",
        unlockAudio
      );

      window.removeEventListener(
        "keydown",
        unlockAudio
      );
    }

    window.addEventListener(
      "pointerdown",
      unlockAudio
    );

    window.addEventListener(
      "keydown",
      unlockAudio
    );

    /* ========================================
       NAVIGATION GUARD
    ======================================== */

    if (!buttons.length || !panels.length) {
      console.warn(
        "Console navigation could not initialize because no buttons or panels were found."
      );

      return;
    }

    /* ========================================
       PANEL SWITCHING
    ======================================== */

    function openPanel(panelName, options = {}) {
      const {
        focusButton = false,
        updateHash = false,
        scrollButton = false
      } = options;

      const selectedButton = buttons.find(
        button => button.dataset.panel === panelName
      );

      const selectedPanel = panels.find(
        panel =>
          panel.dataset.panelContent === panelName
      );

      if (!selectedButton || !selectedPanel) {
        console.warn(
          `No matching console button and panel were found for "${panelName}".`
        );

        return;
      }

      /* Update navigation buttons */

      buttons.forEach(button => {
        const isSelected =
          button === selectedButton;

        button.classList.toggle(
          "is-active",
          isSelected
        );

        button.setAttribute(
          "aria-selected",
          String(isSelected)
        );

        button.setAttribute(
          "tabindex",
          isSelected ? "0" : "-1"
        );
      });

      /* Update content panels */

      panels.forEach(panel => {
        const isSelected =
          panel === selectedPanel;

        panel.classList.toggle(
          "is-active",
          isSelected
        );

        panel.setAttribute(
          "aria-hidden",
          String(!isSelected)
        );

        if (isSelected) {
          panel.removeAttribute("inert");
        } else {
          panel.setAttribute("inert", "");
        }
      });

      /* Keyboard navigation focus */

      if (focusButton) {
        selectedButton.focus({
          preventScroll: true
        });
      }

      /* Mobile / keyboard icon scrolling */

      if (scrollButton) {
        selectedButton.scrollIntoView({
          behavior: prefersReducedMotion.matches
            ? "auto"
            : "smooth",

          block: "nearest",
          inline: "center"
        });
      }

      /* Update URL */

      if (updateHash) {
        history.replaceState(
          null,
          "",
          `#${panelName}`
        );
      }

      /* Update soundtrack */

      updateMusic();
    }

    /* ========================================
       ACCESSIBILITY + INTERACTION
    ======================================== */

    buttons.forEach((button, index) => {
      button.setAttribute("role", "tab");

      const panelName = button.dataset.panel;

      if (panelName) {
        button.setAttribute(
          "aria-controls",
          `panel-${panelName}`
        );
      }

      /* Mouse / touch */

      button.addEventListener(
        "click",
        async event => {
          event.preventDefault();

          openPanel(
            button.dataset.panel,
            {
              updateHash: true
            }
          );

          /*
            Explicitly try playback on a Home click.
            This helps with stricter autoplay policies.
          */
          if (
            button.dataset.panel === "home" &&
            music
          ) {
            try {
              if (!audioUnlocked) {
                music.volume = 0;
                await music.play();

                audioUnlocked = true;

                window.removeEventListener(
                  "pointerdown",
                  unlockAudio
                );

                window.removeEventListener(
                  "keydown",
                  unlockAudio
                );
              }

              fadeMusicIn();
            } catch (error) {
              console.warn(
                "Home music could not start:",
                error
              );
            }
          }
        }
      );

      /* Keyboard */

      button.addEventListener(
        "keydown",
        event => {
          let nextIndex = index;

          switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
              nextIndex =
                (index + 1) % buttons.length;
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
              nextIndex =
                buttons.length - 1;
              break;

            case "Enter":
            case " ":
              event.preventDefault();

              openPanel(
                button.dataset.panel,
                {
                  updateHash: true
                }
              );

              if (
                button.dataset.panel === "home"
              ) {
                fadeMusicIn();
              }

              return;

            default:
              return;
          }

          event.preventDefault();

          const nextButton =
            buttons[nextIndex];

          openPanel(
            nextButton.dataset.panel,
            {
              focusButton: true,
              updateHash: true,
              scrollButton: true
            }
          );
        }
      );
    });

    /* ========================================
       PANEL ACCESSIBILITY
    ======================================== */

    panels.forEach(panel => {
      panel.setAttribute(
        "role",
        "tabpanel"
      );

      const panelName =
        panel.dataset.panelContent;

      if (panelName) {
        panel.id = `panel-${panelName}`;
      }
    });

    /* ========================================
       INITIAL PANEL
    ======================================== */

    const hashPanel =
      window.location.hash
        .replace("#", "")
        .trim();

    const hashMatchesPanel =
      buttons.some(
        button =>
          button.dataset.panel === hashPanel
      );

    const initiallyActiveButton =
      hashMatchesPanel
        ? buttons.find(
            button =>
              button.dataset.panel === hashPanel
          )
        : document.querySelector(
            ".console-nav-button.is-active"
          ) || buttons[0];

    openPanel(
      initiallyActiveButton.dataset.panel
    );

    /* ========================================
       HASH CHANGES
    ======================================== */

    window.addEventListener(
      "hashchange",
      () => {
        const panelName =
          window.location.hash
            .replace("#", "")
            .trim();

        const panelExists =
          buttons.some(
            button =>
              button.dataset.panel === panelName
          );

        if (panelExists) {
          openPanel(panelName);
        }
      }
    );

    /* ========================================
       TAB VISIBILITY
    ======================================== */

    /*
      Don't leave music playing while the portfolio
      tab is hidden.
    */

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!music || !audioUnlocked) return;

        if (document.hidden) {
          fadeMusicTo(
            0,
            250,
            () => music.pause()
          );
        } else if (isHomeOpen()) {
          fadeMusicIn();
        }
      }
    );
  });
</script>