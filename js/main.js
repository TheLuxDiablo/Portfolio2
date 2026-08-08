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

  const settingsButton = document.querySelector(
    '.console-nav-button[data-panel="settings"]'
  );

  const panelButtons = buttons.filter(
    button => button !== settingsButton
  );

  const gameCards = Array.from(
    document.querySelectorAll(".game-card")
  );

  const gameStrip = document.querySelector(".game-strip");
  const gameLibrary = document.querySelector(".game-library");
  const clock = document.querySelector(".console-time");
  const music = document.querySelector("audio.console-music");
  const pageWrapper = document.querySelector(".page-wrapper");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );


  /* ========================================
     CONSTANTS
  ======================================== */

  const DEFAULT_MUSIC_VOLUME = 0.20;
  const DEFAULT_SFX_VOLUME = 0.075;

  const SETTINGS_STORAGE_KEY =
    "rose-quartz-console-settings-v1";

  const MUSIC_FADE_DURATION = 500;

  const PAN_ZONE = 0.22;
  const PAN_MAX_SPEED = 440;
  const PAN_ACCELERATION = 0.085;
  const PAN_STOP_EPSILON = 2;

  const ARROW_SCROLL_AMOUNT = 0.72;

  const GAME_HOVER_SFX_COOLDOWN = 45;
  const NAV_HOVER_SFX_COOLDOWN = 45;

  const GAME_LAUNCH_DURATION = 390;


  /* ========================================
     HELPERS
  ======================================== */

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }


  /* ========================================
     RESPONSIVE / TOUCH MODE
  ======================================== */

  const mobileInteractionQuery = window.matchMedia(
    "(max-width: 767px)"
  );

  function isMobileInteractionMode() {
    return mobileInteractionQuery.matches;
  }

  function updateViewportLayout() {
    const viewportHeight = Math.round(
      window.visualViewport?.height || window.innerHeight
    );

    document.documentElement.style.setProperty(
      "--console-viewport-height",
      `${viewportHeight}px`
    );

    if (activeGameCard) {
      requestAnimationFrame(() => {
        positionGameDetails(activeGameCard);
      });
    }
  }


  /* ========================================
     USER SETTINGS
  ======================================== */

  const defaultSettings = {
    musicVolume: DEFAULT_MUSIC_VOLUME,
    sfxVolume: DEFAULT_SFX_VOLUME,
    musicEnabled: true,
    reducedMotion: false,
    highContrast: false,
    largeText: false
  };


  function loadUserSettings() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}"
      );

      return {
        ...defaultSettings,
        ...saved,

        musicVolume: clamp(
          Number(
            saved.musicVolume ??
            defaultSettings.musicVolume
          ),
          0,
          DEFAULT_MUSIC_VOLUME
        ),

        sfxVolume: clamp(
          Number(
            saved.sfxVolume ??
            defaultSettings.sfxVolume
          ),
          0,
          DEFAULT_SFX_VOLUME
        )
      };

    } catch (error) {
      console.warn(
        "Saved console settings could not be loaded:",
        error
      );

      return { ...defaultSettings };
    }
  }


  let userSettings = loadUserSettings();

  let musicTargetVolume = userSettings.musicVolume;
  let sfxMasterVolume = userSettings.sfxVolume;
  let musicEnabled = userSettings.musicEnabled;


  function isReducedMotion() {
    return (
      prefersReducedMotion.matches ||
      userSettings.reducedMotion
    );
  }


  function saveUserSettings() {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(userSettings)
      );
    } catch (error) {
      console.warn(
        "Console settings could not be saved:",
        error
      );
    }
  }


  function applyAccessibilitySettings() {
    document.documentElement.classList.toggle(
      "user-reduced-motion",
      userSettings.reducedMotion
    );

    document.documentElement.classList.toggle(
      "user-high-contrast",
      userSettings.highContrast
    );

    document.documentElement.classList.toggle(
      "user-large-text",
      userSettings.largeText
    );
  }


  applyAccessibilitySettings();


  /* ========================================
     CREATE GAME DETAILS
  ======================================== */

  function createGameDetails() {
    gameCards.forEach(card => {
      const oneLiner = card.dataset.oneLiner?.trim();
      const engine = card.dataset.engine?.trim();
      const role = card.dataset.role?.trim();

      if (!oneLiner && !engine && !role) {
        return;
      }

      if (card.querySelector(".game-card-details")) {
        return;
      }

      const details = document.createElement("div");
      details.className = "game-card-details";


      if (oneLiner) {
        const description = document.createElement("p");

        description.className = "game-card-one-liner";
        description.textContent = oneLiner;

        details.appendChild(description);
      }


      if (engine) {
        const engineRow = document.createElement("div");
        engineRow.className = "game-card-engine";

        const icon = document.createElement("span");
        icon.className = "game-meta-icon";
        icon.setAttribute("aria-hidden", "true");

        icon.innerHTML = `
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <rect
              x="4"
              y="4"
              width="10"
              height="10"
            ></rect>

            <path
              d="
                M7 1V4
                M11 1V4
                M7 14V17
                M11 14V17
                M1 7H4
                M1 11H4
                M14 7H17
                M14 11H17
              "
            ></path>
          </svg>
        `;

        const engineText = document.createElement("span");
        engineText.className = "game-engine-text";
        engineText.textContent = engine;

        engineRow.appendChild(icon);
        engineRow.appendChild(engineText);

        details.appendChild(engineRow);
      }


      if (role) {
        const roleRow = document.createElement("div");
        roleRow.className = "game-card-role";

        const roleIcon = document.createElement("span");
        roleIcon.className = "game-meta-icon";
        roleIcon.setAttribute("aria-hidden", "true");

        roleIcon.innerHTML = `
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <circle
              cx="9"
              cy="5"
              r="3"
            ></circle>

            <path
              d="
                M3 16
                C3 12.5 5.5 10 9 10
                C12.5 10 15 12.5 15 16
              "
            ></path>
          </svg>
        `;

        const roleText = document.createElement("span");
        roleText.className = "game-role-text";
        roleText.textContent = role;

        roleRow.appendChild(roleIcon);
        roleRow.appendChild(roleText);

        details.appendChild(roleRow);
      }

      card.appendChild(details);
    });
  }


  createGameDetails();


  /* ========================================
     AUDIO STATE
  ======================================== */

  let audioUnlocked = false;

  let musicFadeFrame = null;
  let musicToggle = null;

  let uiAudioContext = null;

  let lastGameHoverSfxTime = 0;
  let lastNavHoverSfxTime = 0;


  if (music) {
    music.volume = 0;
  }


  /* ========================================
     WEB AUDIO
  ======================================== */

  function ensureUiAudio() {
    if (uiAudioContext) {
      if (uiAudioContext.state === "suspended") {
        uiAudioContext.resume();
      }

      return uiAudioContext;
    }

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    uiAudioContext = new AudioContextClass();

    return uiAudioContext;
  }


  /* ========================================
     SYNTH SFX
  ======================================== */

  function playTone({
    frequency = 440,
    endFrequency = null,
    duration = 0.07,
    volume = 1,
    type = "sine",
    attack = 0.004
  } = {}) {

    if (sfxMasterVolume <= 0) {
      return;
    }

    const context = ensureUiAudio();

    if (!context) {
      return;
    }

    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    if (endFrequency !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        now + duration
      );
    }

    const peak =
      sfxMasterVolume * volume;

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak),
      now + attack
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }


  function playGameHoverSfx() {
    const now = performance.now();

    if (
      now - lastGameHoverSfxTime <
      GAME_HOVER_SFX_COOLDOWN
    ) {
      return;
    }

    lastGameHoverSfxTime = now;

    playTone({
      frequency: 390,
      endFrequency: 455,
      duration: 0.075,
      volume: 0.55,
      type: "sine"
    });
  }


  function playNavHoverSfx() {
    const now = performance.now();

    if (
      now - lastNavHoverSfxTime <
      NAV_HOVER_SFX_COOLDOWN
    ) {
      return;
    }

    lastNavHoverSfxTime = now;

    playTone({
      frequency: 520,
      endFrequency: 570,
      duration: 0.055,
      volume: 0.38,
      type: "sine"
    });
  }


  function playEdgeClickSfx(direction) {
    const start =
      direction > 0 ? 310 : 390;

    const end =
      direction > 0 ? 430 : 290;

    playTone({
      frequency: start,
      endFrequency: end,
      duration: 0.12,
      volume: 0.6,
      type: "sine"
    });
  }


  function playConfirmSfx() {
    playTone({
      frequency: 440,
      endFrequency: 620,
      duration: 0.11,
      volume: 0.65,
      type: "sine"
    });
  }


  function playGameLaunchSfx() {
    playTone({
      frequency: 360,
      endFrequency: 720,
      duration: 0.14,
      volume: 0.72,
      type: "square"
    });

    window.setTimeout(() => {
      playTone({
        frequency: 690,
        endFrequency: 920,
        duration: 0.09,
        volume: 0.42,
        type: "sine"
      });
    }, 75);
  }


  function playBackSfx() {
    playTone({
      frequency: 430,
      endFrequency: 300,
      duration: 0.09,
      volume: 0.5,
      type: "sine"
    });
  }


  /* ========================================
     MUSIC BUTTON
  ======================================== */

  function createMusicToggle() {
    if (!pageWrapper || !music) {
      return;
    }

    musicToggle = document.createElement("button");

    musicToggle.type = "button";
    musicToggle.className = "music-toggle";

    musicToggle.setAttribute(
      "aria-label",
      "Toggle music"
    );

    musicToggle.setAttribute(
      "title",
      "Toggle music"
    );

    musicToggle.innerHTML = `
      <span
        class="music-pixel-icon"
        aria-hidden="true"
      >
        <span
          class="music-pixel-note-stem"
        ></span>

        <span
          class="music-pixel-note-head"
        ></span>

        <span
          class="music-pixel-mute"
        ></span>
      </span>
    `;

    pageWrapper.appendChild(musicToggle);
  }


  createMusicToggle();


  /* ========================================
     BOTTOM-LEFT CONSOLE FOOTER
  ======================================== */

  let consoleFooter = null;


  function createConsoleFooter() {
    if (!pageWrapper) {
      return;
    }

    if (pageWrapper.querySelector(".console-footer")) {
      return;
    }

    consoleFooter = document.createElement("div");
    consoleFooter.className = "console-footer";
    consoleFooter.setAttribute("aria-hidden", "true");

    const year = new Date().getFullYear();

    consoleFooter.innerHTML = `
      <span class="console-footer-owner">
        © ${year} Sidd Anand
      </span>

      <span class="console-footer-divider"></span>

      <span class="console-footer-status">
        Game Design + Development
      </span>
    `;

    pageWrapper.appendChild(consoleFooter);
  }


  createConsoleFooter();


  /* ========================================
     SETTINGS MODAL
  ======================================== */

  let settingsOverlay = null;
  let settingsDialog = null;
  let settingsCloseButton = null;

  let musicSlider = null;
  let musicValue = null;

  let sfxSlider = null;
  let sfxValue = null;

  let reducedMotionToggle = null;
  let highContrastToggle = null;
  let largeTextToggle = null;

  let resetSettingsButton = null;

  let settingsOpen = false;
  let settingsPreviousFocus = null;


  function percentFromMusicVolume() {
    if (DEFAULT_MUSIC_VOLUME <= 0) {
      return 0;
    }

    return Math.round(
      (
        musicTargetVolume /
        DEFAULT_MUSIC_VOLUME
      ) * 100
    );
  }


  function percentFromSfxVolume() {
    if (DEFAULT_SFX_VOLUME <= 0) {
      return 0;
    }

    return Math.round(
      (
        sfxMasterVolume /
        DEFAULT_SFX_VOLUME
      ) * 100
    );
  }


  function createSettingsToggle(
    label,
    description,
    key
  ) {
    return `
      <div class="settings-option settings-toggle-option">

        <div class="settings-option-copy">

          <div class="settings-option-label">
            ${label}
          </div>

          <div class="settings-option-description">
            ${description}
          </div>

        </div>

        <button
          class="settings-switch"
          type="button"
          role="switch"
          aria-checked="false"
          data-setting="${key}"
        >
          <span
            class="settings-switch-track"
            aria-hidden="true"
          >
            <span
              class="settings-switch-thumb"
            ></span>
          </span>

          <span class="settings-switch-text">
            OFF
          </span>
        </button>

      </div>
    `;
  }


  function createSettingsModal() {
    if (settingsOverlay) {
      return;
    }

    settingsOverlay =
      document.createElement("div");

    settingsOverlay.className =
      "settings-overlay";

    settingsOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

    settingsOverlay.innerHTML = `
      <div class="settings-backdrop"></div>

      <div
        class="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabindex="-1"
      >

        <div
          class="settings-screen-scan"
          aria-hidden="true"
        ></div>

        <header class="settings-header">

          <h2
            class="settings-title"
            id="settings-title"
          >
            Settings
          </h2>

          <button
            class="settings-close"
            type="button"
            aria-label="Close settings"
            title="Close settings"
          >
            <span aria-hidden="true"></span>
          </button>

        </header>

        <div class="settings-body">

          <section class="settings-section">

            <div class="settings-section-heading">

              <span class="settings-section-number">
                01
              </span>

              <span class="settings-section-title">
                Audio
              </span>

            </div>


            <div class="settings-option">

              <div class="settings-option-copy">

                <label
                  class="settings-option-label"
                  for="settings-music-volume"
                >
                  Music Volume
                </label>

                <div class="settings-option-description">
                  Controls background music throughout the console.
                </div>

              </div>

              <div class="settings-slider-control">

                <input
                  class="settings-slider"
                  id="settings-music-volume"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                >

                <output
                  class="settings-slider-value"
                  for="settings-music-volume"
                >
                  100%
                </output>

              </div>

            </div>


            <div class="settings-option">

              <div class="settings-option-copy">

                <label
                  class="settings-option-label"
                  for="settings-sfx-volume"
                >
                  UI Sound Volume
                </label>

                <div class="settings-option-description">
                  Controls navigation bleeps, hover sounds, and confirmations.
                </div>

              </div>

              <div class="settings-slider-control">

                <input
                  class="settings-slider"
                  id="settings-sfx-volume"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                >

                <output
                  class="settings-slider-value"
                  for="settings-sfx-volume"
                >
                  100%
                </output>

              </div>

            </div>

          </section>


          <section class="settings-section">

            <div class="settings-section-heading">

              <span class="settings-section-number">
                02
              </span>

              <span class="settings-section-title">
                Accessibility
              </span>

            </div>

            ${createSettingsToggle(
              "Reduced Motion",
              "Stops decorative movement, animated backgrounds, and most interface transitions.",
              "reduced-motion"
            )}

            ${createSettingsToggle(
              "High Contrast",
              "Strengthens text, borders, and focus states for easier visual separation.",
              "high-contrast"
            )}

            ${createSettingsToggle(
              "Larger UI Text",
              "Increases the size of supporting interface text while keeping the layout intact.",
              "large-text"
            )}

          </section>


          <section class="settings-section settings-system-section">

            <div class="settings-section-heading">

              <span class="settings-section-number">
                03
              </span>

              <span class="settings-section-title">
                System
              </span>

            </div>

            <div class="settings-system-row">

              <div class="settings-profile-status">

                <span
                  class="settings-profile-dot"
                  aria-hidden="true"
                ></span>

                <div>
                  <div class="settings-profile-title">
                    Local Profile
                  </div>

                  <div class="settings-profile-subtitle">
                    Preferences save automatically
                  </div>
                </div>

              </div>

              <button
                class="settings-reset"
                type="button"
              >
                Reset Defaults
              </button>

            </div>

          </section>

        </div>


        <footer class="settings-footer">

          <div class="settings-footer-hint">
            <span class="settings-key">
              ESC
            </span>

            <span>Close</span>
          </div>

          <div class="settings-footer-status">
            SYSTEM READY
          </div>

        </footer>

      </div>
    `;

    document.body.appendChild(
      settingsOverlay
    );

    settingsDialog =
      settingsOverlay.querySelector(
        ".settings-dialog"
      );

    settingsCloseButton =
      settingsOverlay.querySelector(
        ".settings-close"
      );

    musicSlider =
      settingsOverlay.querySelector(
        "#settings-music-volume"
      );

    musicValue =
      settingsOverlay.querySelector(
        'output[for="settings-music-volume"]'
      );

    sfxSlider =
      settingsOverlay.querySelector(
        "#settings-sfx-volume"
      );

    sfxValue =
      settingsOverlay.querySelector(
        'output[for="settings-sfx-volume"]'
      );

    reducedMotionToggle =
      settingsOverlay.querySelector(
        '[data-setting="reduced-motion"]'
      );

    highContrastToggle =
      settingsOverlay.querySelector(
        '[data-setting="high-contrast"]'
      );

    largeTextToggle =
      settingsOverlay.querySelector(
        '[data-setting="large-text"]'
      );

    resetSettingsButton =
      settingsOverlay.querySelector(
        ".settings-reset"
      );

    syncSettingsControls();


    /* Backdrop click */

    settingsOverlay.addEventListener(
      "pointerdown",
      event => {
        if (
          event.target === settingsOverlay ||
          event.target.classList.contains(
            "settings-backdrop"
          )
        ) {
          playBackSfx();
          closeSettings();
        }
      }
    );


    /* Close button */

    settingsCloseButton?.addEventListener(
      "click",
      () => {
        playBackSfx();
        closeSettings();
      }
    );


    /* Music slider */

    musicSlider?.addEventListener(
      "input",
      () => {
        const percent =
          Number(musicSlider.value);

        musicTargetVolume =
          DEFAULT_MUSIC_VOLUME *
          (percent / 100);

        userSettings.musicVolume =
          musicTargetVolume;

        if (percent <= 0) {
          musicEnabled = false;
          userSettings.musicEnabled = false;
        } else {
          musicEnabled = true;
          userSettings.musicEnabled = true;
        }

        if (musicValue) {
          musicValue.textContent =
            `${percent}%`;
        }

        updateSliderFill(musicSlider);
        saveUserSettings();

        if (
          music &&
          !music.paused &&
          musicEnabled &&
          isHomeOpen()
        ) {
          cancelMusicFade();
          music.volume = musicTargetVolume;
        }

        if (!musicEnabled) {
          fadeMusicOut();
        }

        updateMusicIcon();
      }
    );


    musicSlider?.addEventListener(
      "change",
      () => {
        playConfirmSfx();
        updateMusic();
      }
    );


    /* SFX slider */

    sfxSlider?.addEventListener(
      "input",
      () => {
        const percent =
          Number(sfxSlider.value);

        sfxMasterVolume =
          DEFAULT_SFX_VOLUME *
          (percent / 100);

        userSettings.sfxVolume =
          sfxMasterVolume;

        if (sfxValue) {
          sfxValue.textContent =
            `${percent}%`;
        }

        updateSliderFill(sfxSlider);
        saveUserSettings();
      }
    );


    sfxSlider?.addEventListener(
      "change",
      () => {
        playConfirmSfx();
      }
    );


    /* Accessibility toggles */

    reducedMotionToggle?.addEventListener(
      "click",
      () => {
        userSettings.reducedMotion =
          !userSettings.reducedMotion;

        applyAccessibilitySettings();
        handleSystemReducedMotionChange();
        saveUserSettings();
        syncSettingsControls();

        playConfirmSfx();
      }
    );


    highContrastToggle?.addEventListener(
      "click",
      () => {
        userSettings.highContrast =
          !userSettings.highContrast;

        applyAccessibilitySettings();
        saveUserSettings();
        syncSettingsControls();

        playConfirmSfx();
      }
    );


    largeTextToggle?.addEventListener(
      "click",
      () => {
        userSettings.largeText =
          !userSettings.largeText;

        applyAccessibilitySettings();
        saveUserSettings();
        syncSettingsControls();

        playConfirmSfx();
      }
    );


    /* Reset */

    resetSettingsButton?.addEventListener(
      "click",
      () => {
        userSettings = {
          ...defaultSettings
        };

        musicTargetVolume =
          DEFAULT_MUSIC_VOLUME;

        sfxMasterVolume =
          DEFAULT_SFX_VOLUME;

        musicEnabled = true;

        applyAccessibilitySettings();
        saveUserSettings();
        syncSettingsControls();

        playConfirmSfx();
        updateMusic();
      }
    );


    /* Modal hover SFX */

    settingsOverlay.addEventListener(
      "pointerover",
      event => {
        const target =
          event.target.closest(
            "button, input"
          );

        if (
          !target ||
          target.dataset.hovered === "true"
        ) {
          return;
        }

        target.dataset.hovered = "true";

        playNavHoverSfx();
      }
    );


    settingsOverlay.addEventListener(
      "pointerout",
      event => {
        const target =
          event.target.closest(
            "button, input"
          );

        if (!target) {
          return;
        }

        target.dataset.hovered = "false";
      }
    );
  }


  /* ========================================
     SETTINGS SLIDER FILL
  ======================================== */

  function updateSliderFill(slider) {
    if (!slider) {
      return;
    }

    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const value = Number(slider.value);

    const percent =
      ((value - min) / (max - min)) * 100;

    slider.style.setProperty(
      "--slider-fill",
      `${percent}%`
    );

    slider.style.setProperty(
      "--range-value",
      `${percent}%`
    );
  }


  /* ========================================
     SETTINGS SWITCH SYNC
  ======================================== */

  function syncSwitch(element, enabled) {
    if (!element) {
      return;
    }

    element.classList.toggle(
      "is-on",
      enabled
    );

    element.setAttribute(
      "aria-checked",
      String(enabled)
    );

    const text =
      element.querySelector(
        ".settings-switch-text"
      );

    if (text) {
      text.textContent =
        enabled ? "ON" : "OFF";
    }
  }


  function syncSettingsControls() {
    if (musicSlider) {
      const percent =
        percentFromMusicVolume();

      musicSlider.value =
        String(percent);

      if (musicValue) {
        musicValue.textContent =
          `${percent}%`;
      }

      updateSliderFill(musicSlider);
    }

    if (sfxSlider) {
      const percent =
        percentFromSfxVolume();

      sfxSlider.value =
        String(percent);

      if (sfxValue) {
        sfxValue.textContent =
          `${percent}%`;
      }

      updateSliderFill(sfxSlider);
    }

    syncSwitch(
      reducedMotionToggle,
      userSettings.reducedMotion
    );

    syncSwitch(
      highContrastToggle,
      userSettings.highContrast
    );

    syncSwitch(
      largeTextToggle,
      userSettings.largeText
    );
  }


  /* ========================================
     SETTINGS FOCUS
  ======================================== */

  function getFocusableSettingsElements() {
    if (!settingsDialog) {
      return [];
    }

    return Array.from(
      settingsDialog.querySelectorAll(`
        button:not([disabled]),
        input:not([disabled]),
        [href],
        [tabindex]:not([tabindex="-1"])
      `)
    ).filter(
      element =>
        !element.hasAttribute("hidden")
    );
  }


  /* ========================================
     OPEN SETTINGS
  ======================================== */

  function openSettings() {
    if (!settingsOverlay || settingsOpen) {
      return;
    }

    settingsOpen = true;

    settingsPreviousFocus =
      document.activeElement;

    syncSettingsControls();

    settingsOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    settingsOverlay.classList.add(
      "is-open"
    );

    document.body.classList.add(
      "settings-open"
    );

    settingsButton?.classList.add(
      "is-settings-open"
    );

    clearActiveGame();

    requestAnimationFrame(() => {
      settingsDialog?.focus({
        preventScroll: true
      });
    });
  }


  /* ========================================
     CLOSE SETTINGS
  ======================================== */

  function closeSettings() {
    if (!settingsOverlay || !settingsOpen) {
      return;
    }

    settingsOpen = false;

    settingsOverlay.classList.remove(
      "is-open"
    );

    settingsOverlay.classList.add(
      "is-closing"
    );

    document.body.classList.remove(
      "settings-open"
    );

    settingsButton?.classList.remove(
      "is-settings-open"
    );

    const finishClose = () => {
      if (settingsOpen) {
        return;
      }

      settingsOverlay.classList.remove(
        "is-closing"
      );

      settingsOverlay.setAttribute(
        "aria-hidden",
        "true"
      );
    };

    if (isReducedMotion()) {
      finishClose();
    } else {
      window.setTimeout(
        finishClose,
        320
      );
    }

    const focusTarget =
      settingsPreviousFocus &&
      document.contains(settingsPreviousFocus)
        ? settingsPreviousFocus
        : settingsButton;

    focusTarget?.focus({
      preventScroll: true
    });
  }


  createSettingsModal();


  /* ========================================
     SETTINGS BUTTON
  ======================================== */

  if (settingsButton) {
    settingsButton.setAttribute(
      "aria-haspopup",
      "dialog"
    );

    settingsButton.setAttribute(
      "aria-label",
      "Open settings"
    );

    settingsButton.setAttribute(
      "title",
      "Settings"
    );

    settingsButton.addEventListener(
      "click",
      event => {
        event.preventDefault();

        ensureUiAudio();
        playConfirmSfx();

        openSettings();
      }
    );
  }


  /* ========================================
     SETTINGS KEYBOARD / FOCUS TRAP
  ======================================== */

  document.addEventListener(
    "keydown",
    event => {
      if (!settingsOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();

        playBackSfx();
        closeSettings();

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable =
        getFocusableSettingsElements();

      if (!focusable.length) {
        event.preventDefault();
        settingsDialog?.focus();
        return;
      }

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();

      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();

      } else if (
        document.activeElement === settingsDialog
      ) {
        event.preventDefault();

        (
          event.shiftKey
            ? last
            : first
        ).focus();
      }
    }
  );


  /* ========================================
     CREATE CAROUSEL EDGES
  ======================================== */

  let leftEdge = null;
  let rightEdge = null;


  function createGameEdges() {
    if (!gameLibrary || !gameStrip) {
      return;
    }

    leftEdge =
      document.createElement("button");

    leftEdge.type = "button";
    leftEdge.className =
      "game-edge game-edge-left";

    leftEdge.setAttribute(
      "aria-label",
      "Previous games"
    );

    leftEdge.innerHTML = `
      <span
        class="game-edge-arrow"
        aria-hidden="true"
      >
        ‹
      </span>
    `;

    rightEdge =
      document.createElement("button");

    rightEdge.type = "button";
    rightEdge.className =
      "game-edge game-edge-right";

    rightEdge.setAttribute(
      "aria-label",
      "More games"
    );

    rightEdge.innerHTML = `
      <span
        class="game-edge-arrow"
        aria-hidden="true"
      >
        ›
      </span>
    `;

    gameLibrary.appendChild(leftEdge);
    gameLibrary.appendChild(rightEdge);
  }


  createGameEdges();


  /* ========================================
     CLOCK
  ======================================== */

  function updateClock() {
    if (!clock) {
      return;
    }

    const now = new Date();

    let hours = now.getHours();

    const minutes =
      String(now.getMinutes()).padStart(
        2,
        "0"
      );

    const period =
      hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    clock.textContent =
      `${hours}:${minutes} ${period}`;
  }


  if (clock) {
    updateClock();

    setInterval(
      updateClock,
      1000
    );
  }


  /* ========================================
     GAME PAN STATE
  ======================================== */

  let activeGameCard = null;

  let panAnimationFrame = null;
  let lastPanTime = null;

  let targetPanVelocity = 0;
  let currentPanVelocity = 0;


  /* ========================================
     ACTIVE GAME
  ======================================== */

  function setActiveGame(card) {
    if (activeGameCard === card) {
      return;
    }

    activeGameCard = card;

    gameCards.forEach(gameCard => {
      gameCard.classList.toggle(
        "is-pointer-target",
        gameCard === card
      );
    });

     positionGameDetails(card);
    playGameHoverSfx();
  }


  function clearActiveGame() {
    activeGameCard = null;

    gameCards.forEach(card => {
      card.classList.remove(
        "is-pointer-target"
      );
    });
  }


  /* ========================================
     GAME HOVER
  ======================================== */

  gameCards.forEach(card => {
    const frame =
      card.querySelector(
        ".game-card-frame"
      );

    card.addEventListener(
      "pointerenter",
      event => {
        if (event.pointerType === "touch") {
          return;
        }

        if (settingsOpen) {
          return;
        }

        setActiveGame(card);
      }
    );

    card.addEventListener(
      "pointerleave",
      () => {
        if (activeGameCard === card) {
          clearActiveGame();
        }
      }
    );


    /* POINTER LIGHT */

    if (frame) {
      card.addEventListener(
        "pointermove",
        event => {
          if (
            activeGameCard !== card ||
            isReducedMotion()
          ) {
            return;
          }

          const rect =
            frame.getBoundingClientRect();

          const x = Math.max(
            0,
            Math.min(
              100,
              (
                (event.clientX - rect.left) /
                rect.width
              ) * 100
            )
          );

          const y = Math.max(
            0,
            Math.min(
              100,
              (
                (event.clientY - rect.top) /
                rect.height
              ) * 100
            )
          );

          frame.style.setProperty(
            "--game-pointer-x",
            `${x}%`
          );

          frame.style.setProperty(
            "--game-pointer-y",
            `${y}%`
          );
        }
      );
    }

    card.addEventListener(
      "focus",
      () => {
        if (settingsOpen) {
          return;
        }

        setActiveGame(card);
      }
    );

    card.addEventListener(
      "blur",
      () => {
        if (activeGameCard === card) {
          clearActiveGame();
        }
      }
    );
  });


  /* ========================================
     GAME CARD LAUNCH
  ======================================== */

  let gameLaunchInProgress = false;


  function isModifiedLinkClick(event) {
    return (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    );
  }


  function getGameDestination(card) {
    if (!card) {
      return "";
    }

    const href =
      card.getAttribute("href")?.trim();

    if (
      !href ||
      href === "#" ||
      href.toLowerCase().startsWith(
        "javascript:"
      )
    ) {
      return "";
    }

    return href;
  }


  function launchGameCard(card) {
    if (
      !card ||
      gameLaunchInProgress ||
      settingsOpen
    ) {
      return;
    }

    const destination =
      getGameDestination(card);

    if (!destination) {
      return;
    }

    gameLaunchInProgress = true;

    targetPanVelocity = 0;
    currentPanVelocity = 0;

    setEdgeStrength(0, 0);

    ensureUiAudio();
    playGameLaunchSfx();

    card.classList.add("is-launching");

    if (isReducedMotion()) {
      window.location.href = destination;
      return;
    }

    pageWrapper?.classList.add(
      "is-game-launching"
    );

    fadeMusicTo(
      0,
      GAME_LAUNCH_DURATION
    );

    window.setTimeout(() => {
      window.location.href = destination;
    }, GAME_LAUNCH_DURATION);
  }


  gameCards.forEach(card => {
    card.addEventListener(
      "click",
      event => {
        if (
          settingsOpen ||
          gameLaunchInProgress ||
          isModifiedLinkClick(event)
        ) {
          return;
        }

        if (
          card.target === "_blank" ||
          card.getAttribute("download") !== null
        ) {
          return;
        }

        const destination =
          getGameDestination(card);

        if (!destination) {
          return;
        }

        /*
          Mobile uses a deliberate two-tap pattern:
          first tap = reveal the hover state/details,
          second tap on that same card = open project.
          Desktop keeps its normal one-click behavior.
        */
        if (isMobileInteractionMode()) {
          event.preventDefault();

          if (activeGameCard !== card) {
            setActiveGame(card);

            card.scrollIntoView({
              behavior: isReducedMotion() ? "auto" : "smooth",
              block: "nearest",
              inline: "center"
            });

            return;
          }

          launchGameCard(card);
          return;
        }

        event.preventDefault();
        launchGameCard(card);
      }
    );
  });


  /* ========================================
     MOBILE TAP-AWAY
  ======================================== */

  document.addEventListener(
    "pointerdown",
    event => {
      if (
        !isMobileInteractionMode() ||
        !activeGameCard ||
        settingsOpen ||
        gameLaunchInProgress
      ) {
        return;
      }

      if (event.target.closest(".game-card")) {
        return;
      }

      clearActiveGame();
    },
    { passive: true }
  );

  function positionGameDetails(card) {
    const details = card?.querySelector(".game-card-details");

    if (!details) {
      return;
    }

    /*
      Details are intentionally tile-relative now.
      CSS owns their width and keeps left: 50% / translateX(-50%),
      so the visual center can never drift away from the card.
    */
    details.style.removeProperty("--details-offset-x");
  }

  /* ========================================
     NAV HOVER SFX
  ======================================== */

  buttons.forEach(button => {
    button.addEventListener(
      "pointerenter",
      event => {
        if (event.pointerType === "touch") {
          return;
        }

        playNavHoverSfx();
      }
    );
  });


  /* ========================================
     EDGE STRENGTH
  ======================================== */

  function setEdgeStrength(
    leftStrength,
    rightStrength
  ) {
    if (!gameLibrary) {
      return;
    }

    gameLibrary.style.setProperty(
      "--edge-left-strength",
      leftStrength.toFixed(3)
    );

    gameLibrary.style.setProperty(
      "--edge-right-strength",
      rightStrength.toFixed(3)
    );

    const lean =
      (rightStrength - leftStrength) * -5;

    gameLibrary.style.setProperty(
      "--shelf-lean",
      `${lean.toFixed(2)}px`
    );
  }


  /* ========================================
     EDGE AVAILABILITY
  ======================================== */

  function updateEdgeAvailability() {
    if (
      !gameStrip ||
      !leftEdge ||
      !rightEdge
    ) {
      return;
    }

    const maxScroll = Math.max(
      0,
      gameStrip.scrollWidth -
      gameStrip.clientWidth
    );

    const atStart =
      gameStrip.scrollLeft <= 2;

    const atEnd =
      gameStrip.scrollLeft >=
      maxScroll - 2;

    leftEdge.classList.toggle(
      "is-disabled",
      atStart
    );

    rightEdge.classList.toggle(
      "is-disabled",
      atEnd
    );

    leftEdge.disabled = atStart;
    rightEdge.disabled = atEnd;
  }


  /* ========================================
     POINTER PAN
  ======================================== */

  function updatePanFromPointer(event) {
    if (
      !gameLibrary ||
      !gameStrip ||
      settingsOpen ||
      gameLaunchInProgress
    ) {
      return;
    }

    const rect =
      gameLibrary.getBoundingClientRect();

    const localX =
      event.clientX -
      rect.left;

    const normalizedX =
      Math.max(
        0,
        Math.min(
          1,
          localX /
          rect.width
        )
      );

    const leftBoundary =
      PAN_ZONE;

    const rightBoundary =
      1 - PAN_ZONE;

    let leftStrength = 0;
    let rightStrength = 0;


    if (
      normalizedX <
      leftBoundary
    ) {
      leftStrength =
        1 -
        normalizedX /
        leftBoundary;

      leftStrength *=
        leftStrength;

      targetPanVelocity =
        -PAN_MAX_SPEED *
        leftStrength;

    } else if (
      normalizedX >
      rightBoundary
    ) {
      rightStrength =
        (
          normalizedX -
          rightBoundary
        ) /
        PAN_ZONE;

      rightStrength *=
        rightStrength;

      targetPanVelocity =
        PAN_MAX_SPEED *
        rightStrength;

    } else {
      targetPanVelocity = 0;
    }


    setEdgeStrength(
      leftStrength,
      rightStrength
    );

    startPanLoop();
  }


  /* ========================================
     PAN LOOP
  ======================================== */

  function startPanLoop() {
    if (
      panAnimationFrame !== null
    ) {
      return;
    }

    lastPanTime =
      performance.now();

    panAnimationFrame =
      requestAnimationFrame(
        animatePan
      );
  }


  function animatePan(currentTime) {
    if (!gameStrip) {
      panAnimationFrame =
        null;

      return;
    }


    const deltaTime =
      Math.min(
        (
          currentTime -
          lastPanTime
        ) /
        1000,
        0.05
      );

    lastPanTime =
      currentTime;


    const smoothing =
      1 -
      Math.pow(
        PAN_ACCELERATION,
        deltaTime * 60
      );


    currentPanVelocity +=
      (
        targetPanVelocity -
        currentPanVelocity
      ) *
      smoothing;


    if (
      Math.abs(
        targetPanVelocity
      ) <
      PAN_STOP_EPSILON &&
      Math.abs(
        currentPanVelocity
      ) <
      PAN_STOP_EPSILON
    ) {
      currentPanVelocity = 0;
    }


    if (
      currentPanVelocity !== 0
    ) {
      const maxScroll =
        Math.max(
          0,
          gameStrip.scrollWidth -
          gameStrip.clientWidth
        );

      let nextScroll =
        gameStrip.scrollLeft +
        currentPanVelocity *
        deltaTime;

      nextScroll =
        Math.max(
          0,
          Math.min(
            maxScroll,
            nextScroll
          )
        );

      gameStrip.scrollLeft =
        nextScroll;


      if (
        nextScroll <= 0 &&
        currentPanVelocity < 0
      ) {
        targetPanVelocity = 0;
        currentPanVelocity = 0;
      }


      if (
        nextScroll >=
          maxScroll &&
        currentPanVelocity > 0
      ) {
        targetPanVelocity = 0;
        currentPanVelocity = 0;
      }

      updateEdgeAvailability();
    }


    const stillMoving =
      Math.abs(
        currentPanVelocity
      ) >
      PAN_STOP_EPSILON;

    const stillTargeting =
      Math.abs(
        targetPanVelocity
      ) >
      PAN_STOP_EPSILON;


    if (
      stillMoving ||
      stillTargeting
    ) {
      panAnimationFrame =
        requestAnimationFrame(
          animatePan
        );

    } else {
      panAnimationFrame = null;
      lastPanTime = null;
    }
  }


  /* ========================================
     LIBRARY POINTER EVENTS
  ======================================== */

  if (gameLibrary) {
    gameLibrary.addEventListener(
      "pointermove",
      event => {
        if (
          event.pointerType ===
          "touch"
        ) {
          return;
        }

        updatePanFromPointer(
          event
        );
      }
    );


    gameLibrary.addEventListener(
      "pointerleave",
      () => {
        targetPanVelocity = 0;

        setEdgeStrength(
          0,
          0
        );

        startPanLoop();
      }
    );
  }


  /* ========================================
     CLICKABLE EDGE ARROWS
  ======================================== */

  function scrollShelfBy(direction) {
    if (
      !gameStrip ||
      settingsOpen ||
      gameLaunchInProgress
    ) {
      return;
    }


    playEdgeClickSfx(
      direction
    );


    const amount =
      gameStrip.clientWidth *
      ARROW_SCROLL_AMOUNT *
      direction;

    const start =
      gameStrip.scrollLeft;

    const maxScroll =
      Math.max(
        0,
        gameStrip.scrollWidth -
        gameStrip.clientWidth
      );

    const target =
      Math.max(
        0,
        Math.min(
          maxScroll,
          start + amount
        )
      );


    if (isReducedMotion()) {
      gameStrip.scrollLeft =
        target;

      updateEdgeAvailability();

      return;
    }


    const duration = 480;

    const startTime =
      performance.now();


    function animate(now) {
      const progress =
        Math.min(
          (
            now -
            startTime
          ) /
          duration,
          1
        );


      const eased =
        progress < 0.5
          ?
          4 *
          progress *
          progress *
          progress
          :
          1 -
          Math.pow(
            -2 *
            progress +
            2,
            3
          ) /
          2;


      gameStrip.scrollLeft =
        start +
        (
          target -
          start
        ) *
        eased;


      updateEdgeAvailability();


      if (
        progress < 1
      ) {
        requestAnimationFrame(
          animate
        );
      }
    }


    requestAnimationFrame(
      animate
    );
  }


  if (leftEdge) {
    leftEdge.addEventListener(
      "click",
      event => {
        event.preventDefault();

        scrollShelfBy(-1);
      }
    );
  }


  if (rightEdge) {
    rightEdge.addEventListener(
      "click",
      event => {
        event.preventDefault();

        scrollShelfBy(1);
      }
    );
  }


  /* ========================================
     STRIP SCROLL
  ======================================== */

  if (gameStrip) {
    gameStrip.addEventListener(
      "scroll",
      updateEdgeAvailability,
      {
        passive: true
      }
    );

    requestAnimationFrame(
      updateEdgeAvailability
    );
  }

  /* ========================================
     MUSIC HELPERS
  ======================================== */

  function isHomeOpen() {
    const activeButton =
      document.querySelector(
        ".console-nav-button.is-active"
      );

    return (
      activeButton?.dataset.panel ===
      "home"
    );
  }


  /* ========================================
     MUSIC ICON
  ======================================== */

  function updateMusicIcon() {
    if (
      !musicToggle ||
      !music
    ) {
      return;
    }


    const audiblyPlaying =
      musicEnabled &&
      musicTargetVolume > 0 &&
      !music.paused &&
      !music.muted &&
      music.volume > 0.001 &&
      !document.hidden;


    musicToggle.classList.toggle(
      "is-playing",
      audiblyPlaying
    );

    musicToggle.classList.toggle(
      "is-muted",
      !audiblyPlaying
    );

    musicToggle.setAttribute(
      "aria-pressed",
      String(audiblyPlaying)
    );

    musicToggle.setAttribute(
      "aria-label",
      audiblyPlaying
        ? "Mute music"
        : "Play music"
    );

    musicToggle.setAttribute(
      "title",
      audiblyPlaying
        ? "Mute music"
        : "Play music"
    );
  }


  /* ========================================
     MUSIC FADE
  ======================================== */

  function cancelMusicFade() {
    if (
      musicFadeFrame !== null
    ) {
      cancelAnimationFrame(
        musicFadeFrame
      );

      musicFadeFrame = null;
    }
  }


  function fadeMusicTo(
    targetVolume,
    duration,
    onComplete = null
  ) {
    if (!music) {
      return;
    }


    cancelMusicFade();


    targetVolume =
      clamp(
        targetVolume,
        0,
        1
      );


    if (
      isReducedMotion() ||
      duration <= 0
    ) {
      music.volume =
        targetVolume;

      updateMusicIcon();

      if (onComplete) {
        onComplete();
      }

      return;
    }


    const startVolume =
      music.volume;

    const difference =
      targetVolume -
      startVolume;

    const startTime =
      performance.now();


    function step(currentTime) {
      const elapsed =
        currentTime -
        startTime;

      const progress =
        Math.min(
          elapsed / duration,
          1
        );

      const eased =
        progress *
        progress *
        (
          3 -
          2 *
          progress
        );

      music.volume =
        clamp(
          startVolume +
          difference *
          eased,
          0,
          1
        );

      updateMusicIcon();


      if (
        progress < 1
      ) {
        musicFadeFrame =
          requestAnimationFrame(
            step
          );

      } else {
        music.volume =
          targetVolume;

        musicFadeFrame = null;

        updateMusicIcon();

        if (onComplete) {
          onComplete();
        }
      }
    }


    musicFadeFrame =
      requestAnimationFrame(
        step
      );
  }


  /* ========================================
     MUSIC IN
  ======================================== */

  async function fadeMusicIn() {
    if (
      !music ||
      !musicEnabled ||
      musicTargetVolume <= 0 ||
      !audioUnlocked ||
      !isHomeOpen()
    ) {
      updateMusicIcon();

      return;
    }


    cancelMusicFade();


    try {
      if (music.paused) {
        music.volume = 0;

        await music.play();
      }

      fadeMusicTo(
        musicTargetVolume,
        MUSIC_FADE_DURATION
      );

      updateMusicIcon();

    } catch (error) {
      console.warn(
        "Music playback was blocked by the browser:",
        error
      );

      updateMusicIcon();
    }
  }


  /* ========================================
     MUSIC OUT
  ======================================== */

  function fadeMusicOut() {
    if (
      !music ||
      music.paused
    ) {
      updateMusicIcon();

      return;
    }


    fadeMusicTo(
      0,
      MUSIC_FADE_DURATION,
      () => {
        music.pause();
        updateMusicIcon();
      }
    );
  }


  /* ========================================
     UPDATE MUSIC
  ======================================== */

  function updateMusic() {
    if (
      !music ||
      !audioUnlocked
    ) {
      updateMusicIcon();

      return;
    }


    if (
      musicEnabled &&
      musicTargetVolume > 0 &&
      isHomeOpen() &&
      !document.hidden
    ) {
      fadeMusicIn();

    } else {
      fadeMusicOut();
    }
  }


  /* ========================================
     MUSIC BUTTON
  ======================================== */

  if (
    musicToggle &&
    music
  ) {
    musicToggle.addEventListener(
      "pointerenter",
      event => {
        if (
          event.pointerType !==
          "touch"
        ) {
          playNavHoverSfx();
        }
      }
    );


    musicToggle.addEventListener(
      "click",
      async event => {
        event.preventDefault();

        ensureUiAudio();
        playConfirmSfx();


        /*
          Toggle based on the user's actual
          enabled/disabled state, not whether
          the audio happens to be paused.
        */

        if (musicEnabled) {
          musicEnabled = false;

          userSettings.musicEnabled =
            false;

          saveUserSettings();

          fadeMusicOut();
          syncSettingsControls();

          return;
        }


        /*
          If music volume was explicitly
          set to zero, restore the default
          level when using the quick button.
        */

        if (
          musicTargetVolume <= 0
        ) {
          musicTargetVolume =
            DEFAULT_MUSIC_VOLUME;

          userSettings.musicVolume =
            musicTargetVolume;
        }


        musicEnabled = true;

        userSettings.musicEnabled =
          true;

        saveUserSettings();
        syncSettingsControls();


        try {
          if (
            music.paused &&
            isHomeOpen()
          ) {
            music.volume = 0;

            await music.play();

            audioUnlocked = true;

            fadeMusicTo(
              musicTargetVolume,
              MUSIC_FADE_DURATION
            );

          } else {
            audioUnlocked = true;
            updateMusic();
          }

        } catch (error) {
          console.warn(
            "Music could not start:",
            error
          );

          updateMusicIcon();
        }
      }
    );
  }


  /* ========================================
     AUDIO EVENT SYNC
  ======================================== */

  if (music) {
    [
      "play",
      "pause",
      "ended",
      "volumechange"
    ].forEach(eventName => {
      music.addEventListener(
        eventName,
        updateMusicIcon
      );
    });
  }


  /* ========================================
     AUDIO UNLOCK
  ======================================== */

  async function unlockAudio() {
    ensureUiAudio();


    if (
      !music ||
      audioUnlocked
    ) {
      return;
    }


    audioUnlocked = true;


    if (
      musicEnabled &&
      musicTargetVolume > 0 &&
      isHomeOpen()
    ) {
      try {
        music.volume = 0;

        await music.play();

        fadeMusicTo(
          musicTargetVolume,
          MUSIC_FADE_DURATION
        );

      } catch (error) {
        console.warn(
          "Audio could not be unlocked:",
          error
        );
      }
    }


    updateMusicIcon();
  }


  window.addEventListener(
    "pointerdown",
    unlockAudio,
    {
      once: true
    }
  );


  window.addEventListener(
    "keydown",
    unlockAudio,
    {
      once: true
    }
  );


  /* ========================================
     NAV GUARD
  ======================================== */

  if (
    !panelButtons.length ||
    !panels.length
  ) {
    console.warn(
      "Console navigation could not initialize because no panel buttons or panels were found."
    );

    updateMusicIcon();

    return;
  }


  /* ========================================
     OPEN PANEL
  ======================================== */

  function openPanel(
    panelName,
    options = {}
  ) {
    const {
      focusButton = false,
      updateHash = false,
      scrollButton = false
    } = options;


    const selectedButton =
      panelButtons.find(
        button =>
          button.dataset.panel ===
          panelName
      );


    const selectedPanel =
      panels.find(
        panel =>
          panel.dataset.panelContent ===
          panelName
      );


    if (
      !selectedButton ||
      !selectedPanel
    ) {
      console.warn(
        `No matching console button and panel were found for "${panelName}".`
      );

      return;
    }


    panelButtons.forEach(button => {
      const selected =
        button === selectedButton;

      button.classList.toggle(
        "is-active",
        selected
      );

      button.setAttribute(
        "aria-selected",
        String(selected)
      );

      button.setAttribute(
        "tabindex",
        selected ? "0" : "-1"
      );
    });


    if (settingsButton) {
      settingsButton.classList.remove(
        "is-active"
      );

      settingsButton.setAttribute(
        "aria-selected",
        "false"
      );
    }


    panels.forEach(panel => {
      const selected =
        panel === selectedPanel;

      panel.classList.toggle(
        "is-active",
        selected
      );

      panel.setAttribute(
        "aria-hidden",
        String(!selected)
      );


      if (selected) {
        panel.removeAttribute(
          "inert"
        );
      } else {
        panel.setAttribute(
          "inert",
          ""
        );
      }
    });


    if (focusButton) {
      selectedButton.focus({
        preventScroll: true
      });
    }


    if (scrollButton) {
      selectedButton.scrollIntoView({
        behavior:
          isReducedMotion()
            ? "auto"
            : "smooth",

        block: "nearest",
        inline: "center"
      });
    }


    if (updateHash) {
      history.replaceState(
        null,
        "",
        `#${panelName}`
      );
    }


    updateMusic();


    requestAnimationFrame(
      updateEdgeAvailability
    );
  }


  /* ========================================
     NORMAL NAVIGATION BUTTONS
  ======================================== */

  panelButtons.forEach(
    (button, index) => {
      button.setAttribute(
        "role",
        "tab"
      );


      const panelName =
        button.dataset.panel;


      if (panelName) {
        button.setAttribute(
          "aria-controls",
          `panel-${panelName}`
        );
      }


      button.addEventListener(
        "click",
        async event => {
          event.preventDefault();

          if (settingsOpen) {
            return;
          }

          ensureUiAudio();
          playConfirmSfx();


          openPanel(
            button.dataset.panel,
            {
              updateHash: true
            }
          );


          if (
            button.dataset.panel ===
              "home" &&
            music &&
            musicEnabled
          ) {
            try {
              if (!audioUnlocked) {
                music.volume = 0;

                await music.play();

                audioUnlocked = true;
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


      button.addEventListener(
        "keydown",
        event => {
          if (settingsOpen) {
            return;
          }


          let nextIndex = index;


          switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
              nextIndex =
                (
                  index + 1
                ) %
                panelButtons.length;
              break;

            case "ArrowLeft":
            case "ArrowUp":
              nextIndex =
                (
                  index -
                  1 +
                  panelButtons.length
                ) %
                panelButtons.length;
              break;

            case "Home":
              nextIndex = 0;
              break;

            case "End":
              nextIndex =
                panelButtons.length - 1;
              break;

            case "Enter":
            case " ":
              event.preventDefault();

              playConfirmSfx();

              openPanel(
                button.dataset.panel,
                {
                  updateHash: true
                }
              );

              return;

            default:
              return;
          }


          event.preventDefault();


          const nextButton =
            panelButtons[nextIndex];


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
    }
  );


  /* ========================================
     SETTINGS KEYBOARD NAV ENTRY
  ======================================== */

  if (settingsButton) {
    settingsButton.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          playConfirmSfx();
          openSettings();

          return;
        }


        if (
          event.key === "ArrowLeft" ||
          event.key === "ArrowUp"
        ) {
          event.preventDefault();

          const lastButton =
            panelButtons[
              panelButtons.length - 1
            ];

          lastButton?.focus({
            preventScroll: true
          });
        }


        if (
          event.key === "Home"
        ) {
          event.preventDefault();

          panelButtons[0]?.focus({
            preventScroll: true
          });
        }
      }
    );


    const lastPanelButton =
      panelButtons[
        panelButtons.length - 1
      ];


    lastPanelButton?.addEventListener(
      "keydown",
      event => {
        if (
          event.key !==
            "ArrowRight" &&
          event.key !==
            "ArrowDown"
        ) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        settingsButton.focus({
          preventScroll: true
        });
      },
      {
        capture: true
      }
    );
  }


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
      panel.id =
        `panel-${panelName}`;
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
    panelButtons.some(
      button =>
        button.dataset.panel ===
        hashPanel
    );


  const initiallyActiveButton =
    hashMatchesPanel
      ?
      panelButtons.find(
        button =>
          button.dataset.panel ===
          hashPanel
      )
      :
      panelButtons.find(
        button =>
          button.classList.contains(
            "is-active"
          )
      )
      ||
      panelButtons[0];


  if (initiallyActiveButton) {
    openPanel(
      initiallyActiveButton.dataset.panel
    );
  }


  /* ========================================
     HASH
  ======================================== */

  window.addEventListener(
    "hashchange",
    () => {
      const panelName =
        window.location.hash
          .replace("#", "")
          .trim();

      const exists =
        panelButtons.some(
          button =>
            button.dataset.panel ===
            panelName
        );

      if (exists) {
        openPanel(panelName);
      }
    }
  );


  /* ========================================
     RESIZE
  ======================================== */

  function handleViewportChange() {
    targetPanVelocity = 0;
    currentPanVelocity = 0;

    setEdgeStrength(
      0,
      0
    );

    updateViewportLayout();

    requestAnimationFrame(
      updateEdgeAvailability
    );
  }

  window.addEventListener(
    "resize",
    handleViewportChange
  );

  window.visualViewport?.addEventListener(
    "resize",
    handleViewportChange
  );

  mobileInteractionQuery.addEventListener?.(
    "change",
    () => {
      clearActiveGame();
      handleViewportChange();
    }
  );


  /* ========================================
     SYSTEM REDUCED MOTION CHANGES
  ======================================== */

  function handleSystemReducedMotionChange() {
    if (isReducedMotion()) {
      targetPanVelocity = 0;
      currentPanVelocity = 0;

      setEdgeStrength(
        0,
        0
      );

      cancelMusicFade();

      if (
        music &&
        !music.paused
      ) {
        music.volume =
          musicEnabled
            ? musicTargetVolume
            : 0;
      }
    }

    updateMusicIcon();
  }


  if (
    typeof prefersReducedMotion
      .addEventListener ===
    "function"
  ) {
    prefersReducedMotion.addEventListener(
      "change",
      handleSystemReducedMotionChange
    );

  } else if (
    typeof prefersReducedMotion
      .addListener ===
    "function"
  ) {
    prefersReducedMotion.addListener(
      handleSystemReducedMotionChange
    );
  }


  /* ========================================
     TAB VISIBILITY
  ======================================== */

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!music) {
        return;
      }


      if (document.hidden) {
        if (!music.paused) {
          fadeMusicTo(
            0,
            250,
            () => {
              music.pause();
              updateMusicIcon();
            }
          );
        }

      } else {
        updateMusic();
      }


      updateMusicIcon();
    }
  );


  /* ========================================
     BLOCK BACKGROUND INTERACTION
     WHILE SETTINGS ARE OPEN
  ======================================== */

  document.addEventListener(
    "pointerdown",
    event => {
      if (
        !settingsOpen ||
        !settingsDialog
      ) {
        return;
      }


      if (
        settingsDialog.contains(
          event.target
        ) ||
        event.target ===
          settingsButton ||
        event.target ===
          settingsOverlay ||
        event.target.classList?.contains(
          "settings-backdrop"
        )
      ) {
        return;
      }


      event.stopPropagation();

    },
    true
  );


  /* ========================================
     INITIAL SETTINGS SYNC
  ======================================== */

  userSettings.musicEnabled =
    musicEnabled;

  applyAccessibilitySettings();
  syncSettingsControls();
  saveUserSettings();


  /* ========================================
     INITIAL MUSIC STATE
  ======================================== */

  if (music) {
    music.volume = 0;
  }

  updateMusicIcon();
  updateViewportLayout();

  requestAnimationFrame(
    updateEdgeAvailability
  );

});

/* ========================================
   SIDD ANAND — CURSOR-REACTIVE LOGO
   Add this to your existing JS.

   Hover:
   - reacts continuously to cursor position
   - closest letters lift, brighten, scale,
     and tilt the most
   - nearby letters follow with falloff

   Click:
   - quick press-in / rebound
   - no spark burst or fake scatter
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const name =
      document.querySelector(
        ".console-name"
      );

    if (!name) {
      return;
    }

    const originalText =
      name.textContent;

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    let pressLocked = false;


    /* ========================================
       BUILD LETTER SPANS
    ======================================== */

    function buildNameLetters() {

      name.textContent = "";

      Array.from(
        originalText
      ).forEach(
        (
          character,
          index
        ) => {

          const letter =
            document.createElement(
              "span"
            );

          letter.className =
            "console-name-letter";

          letter.dataset.index =
            String(index);

          if (
            character === " "
          ) {
            letter.innerHTML =
              "&nbsp;";
          } else {
            letter.textContent =
              character;
          }

          name.appendChild(
            letter
          );
        }
      );
    }

    buildNameLetters();


    /* ========================================
       ACCESSIBILITY
    ======================================== */

    name.setAttribute(
      "role",
      "button"
    );

    name.setAttribute(
      "tabindex",
      "0"
    );

    name.setAttribute(
      "aria-label",
      originalText
    );


    /* ========================================
       HELPERS
    ======================================== */

    function isReducedMotion() {
      return (
        prefersReducedMotion.matches ||
        document.documentElement
          .classList
          .contains(
            "user-reduced-motion"
          )
      );
    }


    function clamp(
      value,
      min,
      max
    ) {
      return Math.min(
        max,
        Math.max(
          min,
          value
        )
      );
    }


    function resetLetters() {

      const letters =
        name.querySelectorAll(
          ".console-name-letter"
        );

      letters.forEach(
        letter => {

          letter.style.setProperty(
            "--letter-x",
            "0px"
          );

          letter.style.setProperty(
            "--letter-y",
            "0px"
          );

          letter.style.setProperty(
            "--letter-rotate",
            "0deg"
          );

          letter.style.setProperty(
            "--letter-scale",
            "1"
          );

          letter.style.setProperty(
            "--letter-brightness",
            "1"
          );

          letter.style.setProperty(
            "--letter-pink",
            "0%"
          );
        }
      );
    }


    /* ========================================
       CURSOR REACTION
    ======================================== */

    function updateLetterReaction(
      event
    ) {

      if (
        isReducedMotion()
      ) {
        return;
      }

      const letters =
        Array.from(
          name.querySelectorAll(
            ".console-name-letter"
          )
        );

      if (
        !letters.length
      ) {
        return;
      }

      const nameRect =
        name.getBoundingClientRect();

      const cursorX =
        event.clientX -
        nameRect.left;

      /*
        Radius controls how many letters
        react around the cursor.
      */

      const influenceRadius =
        112;

      letters.forEach(
        (
          letter,
          index
        ) => {

          const rect =
            letter.getBoundingClientRect();

          const centerX =
            (
              rect.left -
              nameRect.left
            ) +
            rect.width / 2;

          const distance =
            Math.abs(
              cursorX -
              centerX
            );

          const strength =
            clamp(
              1 -
              distance /
              influenceRadius,
              0,
              1
            );

          /*
            Nonlinear falloff makes the
            nearest letter feel much more
            tactile than distant ones.
          */

          const punch =
            strength *
            strength;

          const direction =
            cursorX >=
            centerX
              ? -1
              : 1;

          const lift =
            -Math.round(
              punch * 11
            );

          const push =
            Math.round(
              punch *
              3 *
              direction
            );

          const rotation =
            (
              punch *
              2.6 *
              direction
            ).toFixed(2);

          const scale =
            (
              1 +
              punch * 0.095
            ).toFixed(3);

          const brightness =
            (
              1 +
              punch * 0.28
            ).toFixed(3);

          const pink =
            Math.round(
              punch * 100
            );

          letter.style.setProperty(
            "--letter-x",
            `${push}px`
          );

          letter.style.setProperty(
            "--letter-y",
            `${lift}px`
          );

          letter.style.setProperty(
            "--letter-rotate",
            `${rotation}deg`
          );

          letter.style.setProperty(
            "--letter-scale",
            scale
          );

          letter.style.setProperty(
            "--letter-brightness",
            brightness
          );

          letter.style.setProperty(
            "--letter-pink",
            `${pink}%`
          );
        }
      );
    }


    name.addEventListener(
      "pointerenter",
      event => {

        if (
          event.pointerType ===
          "touch"
        ) {
          return;
        }

        name.classList.add(
          "is-reacting"
        );

        updateLetterReaction(
          event
        );
      }
    );


    name.addEventListener(
      "pointermove",
      event => {

        if (
          event.pointerType ===
          "touch"
        ) {
          return;
        }

        name.classList.add(
          "is-reacting"
        );

        updateLetterReaction(
          event
        );
      }
    );


    name.addEventListener(
      "pointerleave",
      () => {

        name.classList.remove(
          "is-reacting"
        );

        resetLetters();
      }
    );


    /* ========================================
       CLICK PRESS
    ======================================== */

    function playPress() {

      if (
        pressLocked ||
        isReducedMotion()
      ) {
        return;
      }

      pressLocked = true;

      name.classList.remove(
        "is-pressed"
      );

      void name.offsetWidth;

      name.classList.add(
        "is-pressed"
      );

      window.setTimeout(
        () => {

          name.classList.remove(
            "is-pressed"
          );

          pressLocked = false;
        },
        220
      );
    }


    name.addEventListener(
      "click",
      playPress
    );


    /* ========================================
       KEYBOARD SUPPORT
    ======================================== */

    name.addEventListener(
      "keydown",
      event => {

        if (
          event.key !==
            "Enter" &&
          event.key !==
            " "
        ) {
          return;
        }

        event.preventDefault();

        playPress();
      }
    );


    /* ========================================
       INITIAL STATE
    ======================================== */

    resetLetters();
  }
);
