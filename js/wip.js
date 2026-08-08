document.addEventListener("DOMContentLoaded", () => {
  const music = document.querySelector(".wip-music");
  const musicButton = document.querySelector(".wip-music-toggle");
  const musicLabel = document.querySelector(".wip-music-label");

  if (!music || !musicButton) return;

  const targetVolume = 0.18;
  let isPlaying = false;
  let fadeFrame = null;

  music.volume = 0;

  function updateMusicUI() {
    musicButton.classList.toggle("is-playing", isPlaying);

    if (musicLabel) {
      musicLabel.textContent = isPlaying ? "MUSIC ON" : "MUSIC";
    }

    musicButton.setAttribute(
      "aria-label",
      isPlaying ? "Turn music off" : "Turn music on"
    );
  }

  function fadeMusic(to, duration = 500, onComplete = null) {
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
    }

    const from = music.volume;
    const difference = to - from;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      music.volume = Math.max(0, Math.min(1, from + difference * progress));

      if (progress < 1) {
        fadeFrame = requestAnimationFrame(step);
      } else {
        fadeFrame = null;
        if (onComplete) onComplete();
      }
    }

    fadeFrame = requestAnimationFrame(step);
  }

  async function playMusic() {
    try {
      if (fadeFrame) cancelAnimationFrame(fadeFrame);

      music.volume = 0;
      await music.play();

      isPlaying = true;
      updateMusicUI();
      fadeMusic(targetVolume, 600);
    } catch (error) {
      console.log("WIP music playback requires user interaction.");
    }
  }

  function pauseMusic() {
    isPlaying = false;
    updateMusicUI();

    fadeMusic(0, 300, () => {
      if (!isPlaying) {
        music.pause();
      }
    });
  }

  musicButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  /*
    Browsers generally block audible autoplay.
    Start the track on the visitor's first interaction
    anywhere on the page.
  */
  function unlockAudio(event) {
    if (isPlaying) return;

    if (
      event &&
      event.target &&
      event.target.closest &&
      event.target.closest(".wip-music-toggle")
    ) {
      return;
    }

    playMusic();

    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  }

  window.addEventListener("pointerdown", unlockAudio);
  window.addEventListener("keydown", unlockAudio);

  updateMusicUI();
});
